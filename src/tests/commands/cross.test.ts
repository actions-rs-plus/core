import * as core from "@actions/core";
import * as io from "@actions/io";
import { describe, expect, it, vi } from "vitest";

import { Cross } from "../../core.js";

vi.mock("@actions/exec");

describe("cross", () => {
    it("Cross", async () => {
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
        expect(spy3.mock.calls).toMatchObject([["/tmp"], ["/somewhere/on/the/machine"]]);
    });

    it("Cross getOrInstall", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross getOrInstall fail", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = vi.spyOn(Cross, "get").mockRejectedValue(new Error("Not found"));
        const spy3 = vi.spyOn(core, "debug");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([["Error: Not found"]]);
    });
});
