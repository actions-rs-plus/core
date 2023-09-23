import * as io from "@actions/io";

import { RustUp } from "core";

jest.mock("@actions/io");

describe("rustup", () => {
    const originalPlatform = process.platform;

    beforeEach(() => {
        Object.defineProperty(process, "platform", {
            value: "linux",
        });
    });

    afterEach(function () {
        Object.defineProperty(process, "platform", {
            value: originalPlatform,
        });
    });

    it("get", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValue("/home/user/.cargo/bin/rustup");

        await expect(RustUp.get()).resolves.toEqual({ path: "/home/user/.cargo/bin/rustup" });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    // it("getOrInstall", async () => {
    //     const spy = jest.spyOn(io, "which").mockResolvedValue("/home/user/.cargo/bin/rustup");

    //     await expect(RustUp.getOrInstall()).resolves.toEqual({ path: "/home/user/.cargo/bin/rustup" });

    //     expect(spy).toHaveBeenCalledTimes(1);
    // });

    it("getOrInstall install", async () => {
        // prepare instance to return after installation
        const prepared = jest.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        const rustup = await RustUp.get();
        prepared.mockClear();

        // actual test
        const spy1 = jest.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to rustup"));
        const spy2 = jest.spyOn(RustUp, "install").mockResolvedValue(rustup);

        await expect(RustUp.getOrInstall()).resolves.toEqual({ path: "/home/user/.cargo/bin/rustup" });

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });

    it("install", async () => {
        Object.defineProperty(process, "platform", {
            value: "sunos",
        });

        expect.assertions(1);

        // await expect(RustUp.install()).rejects.toThrow(/Unknown platform/);
        try {
            const r = await RustUp.install();

            console.log(r);
        } catch (error: unknown) {
            expect((error as Error)?.message).toMatch(/Unknown platform/);
        }
    });

    async function test(t: boolean): Promise<string> {
        if (t) {
            throw new Error("OMG WTF BBQ");
        }
        return await Promise.resolve("foo");
    }

    it("throws?", async () => {
        await expect(test(true)).rejects.toThrowError(/OMG/);
    });
});
