import * as cache from "@actions/cache";
import * as exec from "@actions/exec";
import * as github from "@actions/github";

import * as http from "@actions/http-client";
import { type TypedResponse } from "@actions/http-client/lib/interfaces";
import * as io from "@actions/io";

import { Cargo, resolveVersion } from "core";
import { type CratesIO } from "schema";

jest.mock("@actions/http-client");
jest.mock("@actions/io");
jest.mock("@actions/exec");
jest.mock("@actions/cache");

describe("cargo", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        github.context.sha = "sha";

        jest.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("resolveVersion", async () => {
        const version = "1.0.107";

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue({
            statusCode: 200,
            headers: {},
            result: {
                crate: {
                    newest_version: version,
                },
            },
        });

        await expect(resolveVersion("serde_json")).resolves.toBe(version);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("resolveVersion not found", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 404,
            headers: {},
            result: {
                errors: [
                    {
                        detail: "Not Found",
                    },
                ],
            },
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Could not find package");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("resolveVersion fail 500", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 500,
            headers: {},
            result: null,
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Unable to fetch latest crate version");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("resolveVersion ok but still not crate version", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 200,
            headers: {},
            result: {
                crate: {},
            },
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Unable to fetch latest crate version");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cargo", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValue("/home/user/.cargo/bin/cargo");

        await expect(Cargo.get()).resolves.not.toBeNull();

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cargo not found", async () => {
        const spy = jest.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to cargo"));

        await expect(Cargo.get()).rejects.toThrow("Could not find path to cargo");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cargo findOrInstall", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockResolvedValueOnce("/home/kristof/.cargo/bin/cog");

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog")).resolves.toBe("cog");

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("Cargo findOrInstall not found", async () => {
        const spy = jest
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/cargo")
            .mockRejectedValueOnce(new Error("Could not find path to cog"))
            .mockResolvedValueOnce("/home/user/.cargo/bin/cog");

        const spy2 = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([
            ["cargo", true],
            ["cog", true],
        ]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "cog"]]]);
    });

    it("Cargo findOrInstall not found with version", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog", "5.9")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([
            ["cargo", true],
            ["cog", true],
        ]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"]]]);
    });

    it("Cargo findOrInstall not found with explicit version latest", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const spy3 = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue({
            statusCode: 200,
            headers: {},
            result: {
                crate: {
                    newest_version: "6.0",
                },
            },
        });

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog", "latest")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([
            ["cargo", true],
            ["cog", true],
        ]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "--version", "6.0", "cog"]]]);
        expect(spy3).toHaveBeenCalledTimes(1);
    });

    it("Cargo findOrInstall not found", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "cog"]]]);
    });

    it("Cargo findOrInstall not found with explicit version latest", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const spy3 = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue({
            statusCode: 200,
            headers: {},
            result: {
                crate: {
                    newest_version: "6.0",
                },
            },
        });

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "latest")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "--version", "6.0", "cog"]]]);
        expect(spy3).toHaveBeenCalledTimes(1);
    });

    it("Cargo findOrInstall with primary key", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo").mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = jest.spyOn(cache, "restoreCache").mockResolvedValueOnce("cache-key");

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog", []]]);
    });
});
