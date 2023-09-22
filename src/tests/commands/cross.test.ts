import * as core from "@actions/core";
import * as github from "@actions/github";

import * as io from "@actions/io";

import { Cross } from "core";

jest.mock("@actions/exec");
jest.mock("@actions/cache");

describe("cross", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        github.context.sha = "sha";

        jest.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("Cross", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValue("/home/user/.cross/bin/cross");

        await expect(Cross.get()).resolves.not.toBeNull();

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross not found", async () => {
        const spy = jest.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to cross"));

        await expect(Cross.get()).rejects.toThrow("Could not find path to cross");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross install", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = jest.spyOn(process, "cwd").mockReturnValueOnce("/somewhere/on/the/machine");
        const spy3 = jest.spyOn(process, "chdir").mockReturnValue(undefined);

        await expect(Cross.install("10.0")).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([["/tmp"], ["/somewhere/on/the/machine"]]);
    });

    it("Cross getOrInstall", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cross getOrInstall fail", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cross/bin/cross");
        const spy2 = jest.spyOn(Cross, "get").mockRejectedValue(new Error("Not found"));
        const spy3 = jest.spyOn(core, "debug");

        await expect(Cross.getOrInstall()).resolves.toBeInstanceOf(Cross);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3.mock.calls).toMatchObject([["Error: Not found"]]);
    });
});
