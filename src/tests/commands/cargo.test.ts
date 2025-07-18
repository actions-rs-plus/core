import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as http from "@actions/http-client";
import * as io from "@actions/io";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cargo } from "@/core.ts";

vi.mock("@actions/exec");
vi.mock("@actions/cache");

describe("cargo", () => {
    let startGroupSpy: MockInstance<(_: string) => void> | null = null;
    let endGroupSpy: MockInstance<() => void> | null = null;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        startGroupSpy = vi.spyOn(core, "startGroup").mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        endGroupSpy = vi.spyOn(core, "endGroup").mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        vi.spyOn(core, "info").mockImplementation(() => {});

        // eslint-disable-next-line unicorn/no-useless-undefined -- explicit
        vi.spyOn(cache, "restoreCache").mockResolvedValue(undefined);
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- set by beforeeach, if that fails, we expect to see it here too
        expect(startGroupSpy!.mock.calls.length).toBe(endGroupSpy!.mock.calls.length);
    });

    it("Cargo", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");

        await expect(Cargo.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/cargo",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("Cargo not found", async () => {
        const spy = vi.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to cargo"));
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        const spy2 = vi.spyOn(core, "error").mockImplementation(() => {});

        await expect(Cargo.get()).rejects.toThrow("Could not find path to cargo");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(2);
    });

    it("Cargo findOrInstall", async () => {
        const spy = vi
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/cargo")
            .mockResolvedValueOnce("/home/kristof/.cargo/bin/cog");

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog")).resolves.toBe("cog");

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("Cargo findOrInstall not found", async () => {
        const spy = vi
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/cargo")
            .mockRejectedValueOnce(new Error("Could not find path to cog"))
            .mockResolvedValueOnce("/home/user/.cargo/bin/cog");

        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([
            ["cargo", true],
            ["cog", true],
        ]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "cog"], undefined]]);
    });

    it("Cargo findOrInstall not found with version", async () => {
        const spy = vi
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/cargo")
            .mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.findOrInstall("cog", "5.9")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([
            ["cargo", true],
            ["cog", true],
        ]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
    });

    it("Cargo findOrInstall not found with explicit version latest", async () => {
        const spy = vi
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/cargo")
            .mockRejectedValueOnce(new Error("Could not find path to cog"));

        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const spy3 = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce({
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
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "6.0", "cog"], undefined],
        ]);
        expect(spy3).toHaveBeenCalledTimes(1);
    });

    it("Cargo findOrInstall not found", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");

        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([["/home/user/.cargo/bin/cargo", ["install", "cog"], undefined]]);
    });

    it("Cargo findOrInstall not found with explicit version latest", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const spy3 = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce({
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
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "6.0", "cog"], undefined],
        ]);
        expect(spy3).toHaveBeenCalledTimes(1);
    });

    it("Cargo findOrInstall with primary key", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
    });

    it("Cargo findOrInstall with no specific version and primary key", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(cache, "restoreCache").mockResolvedValueOnce("cache-key");

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", undefined, "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-cog", []]]);
    });

    it("Cargo findOrInstall with no specific version, primary key & restore keys", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(cache, "restoreCache").mockResolvedValueOnce("cache-key");

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", undefined, "cog", ["cog1", "cog2", "cog3"])).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            [["/home/user/.cargo/bin/cog"], "cog-cog", ["cog-cog1", "cog-cog2", "cog-cog3"]],
        ]);
    });

    it("Cargo findOrInstall with primary key & restore keys", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog", ["cog1", "cog2", "cog3"])).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
    });

    it("Cargo findOrInstall with primary key, no cache key", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(cache, "restoreCache").mockResolvedValueOnce("cache-key");

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog", []]]);
    });

    it("Cargo findOrInstall with primary key, cache save fails 1", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const spy3 = vi.spyOn(cache, "saveCache").mockRejectedValue("failed to save cache");
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        const spy4 = vi.spyOn(core, "warning").mockImplementation(() => {});

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
        expect(spy3.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog"]]);
        expect(spy4.mock.calls).toEqual([["failed to save cache"]]);
    });

    it("Cargo findOrInstall with primary key, cache save fails 2", async () => {
        const actionsCacheActual = await vi.importActual<typeof cache>("@actions/cache");

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const spy3 = vi
            .spyOn(cache, "saveCache")
            .mockRejectedValue(new actionsCacheActual.ValidationError("failed to save cache"));

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).rejects.toBeInstanceOf(
            actionsCacheActual.ValidationError,
        );

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
        expect(spy3.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog"]]);
    });

    it("Cargo findOrInstall with primary key, cache save fails 3", async () => {
        const actionsCacheActual = await vi.importActual<typeof cache>("@actions/cache");

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const spy3 = vi
            .spyOn(cache, "saveCache")
            .mockRejectedValue(new actionsCacheActual.ReserveCacheError("failed reserve space"));
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- mock
        const spy4 = vi.spyOn(core, "warning").mockImplementation(() => {});

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).resolves.toBe("cog");

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
        expect(spy3.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog"]]);
        expect(spy4.mock.calls).toEqual([["failed reserve space"]]);
    });

    it("Cargo findOrInstall with primary key, cache save fails 4", async () => {
        class Special {
            public readonly f: string;
            public constructor(f: string) {
                this.f = f;
            }
        }

        const special = new Special("I don't implement Error");
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/cargo");
        const spy2 = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const spy3 = vi.spyOn(cache, "saveCache").mockRejectedValue(special);

        const cargo = await Cargo.get();

        await expect(cargo.installCached("cog", "5.9", "cog")).rejects.toEqual(special);

        expect(spy.mock.calls).toEqual([["cargo", true]]);
        expect(spy2.mock.calls).toEqual([
            ["/home/user/.cargo/bin/cargo", ["install", "--version", "5.9", "cog"], undefined],
        ]);
        expect(spy3.mock.calls).toEqual([[["/home/user/.cargo/bin/cog"], "cog-5.9-cog"]]);
    });
});
