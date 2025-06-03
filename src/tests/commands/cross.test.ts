import * as os from "node:os";

import * as core from "@actions/core";
import * as io from "@actions/io";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cross } from "@/core";

vi.mock("@actions/exec");

describe("cross", () => {
    let startGroupSpy: MockInstance<(_: string) => void> | null = null;
    let endGroupSpy: MockInstance<() => void> | null = null;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        startGroupSpy = vi.spyOn(core, "startGroup").mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        endGroupSpy = vi.spyOn(core, "endGroup").mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        vi.spyOn(core, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- set by beforeeach, if that fails, we expect to see it here too
        expect(startGroupSpy!.mock.calls.length).toBe(endGroupSpy!.mock.calls.length);
    });

    it("Cross", async () => {
        vi.spyOn(core, "debug").mockResolvedValueOnce();

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cross");

        await expect(Cross.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/cross",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross not found", async () => {
        const spy = vi.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to cross"));

        await expect(Cross.get()).rejects.toThrow("Could not find path to cross");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross install", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = vi.spyOn(process, "cwd").mockReturnValueOnce("/somewhere/on/the/machine");
        const spy3 = vi.spyOn(process, "chdir").mockReturnValue();

        await expect(Cross.install("10.0")).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([[os.tmpdir()], ["/somewhere/on/the/machine"]]);
    });

    it("Cross getOrInstall", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross getOrInstall fail", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = vi.spyOn(Cross, "get").mockRejectedValue(new Error("Not found"));
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        const spy3 = vi.spyOn(core, "debug").mockImplementationOnce((_s: string) => {});

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([["Error: Not found"]]);
    });
});
