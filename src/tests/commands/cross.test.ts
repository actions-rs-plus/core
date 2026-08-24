import { tmpdir } from "node:os";

// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as core from "@actions/core";
// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as io from "@actions/io";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cross } from "../../core";

vi.mock("@actions/exec");

describe("cross", () => {
    let startGroupSpy: MockInstance<(message: string) => void> | null = null;
    let endGroupSpy: MockInstance<() => void> | null = null;

    beforeEach(() => {
        // oxlint-disable-next-line no-empty-function -- mock
        startGroupSpy = vi.spyOn(core, "startGroup").mockImplementation(() => {});
        // oxlint-disable-next-line no-empty-function -- mock
        endGroupSpy = vi.spyOn(core, "endGroup").mockImplementation(() => {});
        // oxlint-disable-next-line no-empty-function -- mock
        vi.spyOn(core, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        // oxlint-disable-next-line typescript/no-non-null-assertion -- set by beforeeach, if that fails, we expect to see it here too
        expect(startGroupSpy!.mock.calls.length).toBe(endGroupSpy!.mock.calls.length);
    });

    it("Cross", async () => {
        expect.assertions(2);

        vi.spyOn(core, "debug").mockResolvedValueOnce();

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cross");

        await expect(Cross.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/cross",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross not found", async () => {
        expect.assertions(2);

        const spy = vi.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to cross"));

        await expect(Cross.get()).rejects.toThrow("Could not find path to cross");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross install", async () => {
        expect.assertions(4);

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = vi.spyOn(process, "cwd").mockReturnValueOnce("/somewhere/on/the/machine");
        const spy3 = vi.spyOn(process, "chdir").mockReturnValue();

        await expect(Cross.install("10.0")).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([[tmpdir()], ["/somewhere/on/the/machine"]]);
    });

    it("Cross getOrInstall", async () => {
        expect.assertions(2);

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross getOrInstall fail", async () => {
        expect.assertions(4);

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = vi.spyOn(Cross, "get").mockRejectedValue(new Error("Not found"));
        // oxlint-disable-next-line no-empty-function -- mock
        const spy3 = vi.spyOn(core, "debug").mockImplementationOnce((_s: string) => {});

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([["Error: Not found"]]);
    });
});
