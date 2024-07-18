import { promises as fs } from "fs";

import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import { describe, expect, it, test, vi } from "vitest";

import { RustUp } from "@/core";

const osMocks = vi.hoisted(() => {
    return {
        platform: vi.fn().mockReturnValue("linux"),
    };
});

vi.mock("node:os", () => {
    return {
        platform: osMocks.platform,
    };
});

describe("rustup", () => {
    it("get", async () => {
        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        await expect(RustUp.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("getOrInstall install", async () => {
        // prepare instance to return after installation
        const prepared = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        const rustup = await RustUp.get();
        prepared.mockClear();

        // actual test
        const spy1 = vi.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to rustup"));
        const spy2 = vi.spyOn(RustUp, "install").mockResolvedValueOnce(rustup);

        await expect(RustUp.getOrInstall()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });

    it("install unknown platform", async () => {
        osMocks.platform.mockReturnValueOnce("sunos");

        expect.assertions(1);

        await expect(RustUp.install()).rejects.toThrow(/Unknown platform/);
    });

    test.each([["linux" as typeof process.platform], ["darwin" as typeof process.platform]])(
        "install %s",
        async (platform: typeof process.platform) => {
            vi.spyOn(fs, "chmod").mockResolvedValueOnce();
            osMocks.platform.mockReturnValueOnce(platform);

            const downloadSpy = vi.spyOn(tc, "downloadTool").mockResolvedValueOnce("/tmp/rustup.sh");
            const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

            expect.assertions(3);

            await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
            expect(downloadSpy.mock.calls).toEqual([["https://sh.rustup.rs"]]);
            expect(execSpy.mock.calls).toEqual([["/tmp/rustup.sh", ["--default-toolchain", "none", "-y"]]]);
        },
    );

    it("install win32", async () => {
        osMocks.platform.mockReturnValueOnce("win32");
        const downloadSpy = vi.spyOn(tc, "downloadTool").mockResolvedValueOnce("C:\\TEMP\\rustup.exe");
        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(3);

        await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
        expect(downloadSpy.mock.calls).toEqual([["https://win.rustup.rs"]]);
        expect(execSpy.mock.calls).toEqual([["C:\\TEMP\\rustup.exe", ["--default-toolchain", "none", "-y"]]]);
    });

    it("installToolchain", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.installToolchain("stable")).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable"], undefined],
        ]);
    });

    it("installToolchain stable-x86_64-pc-windows-msvc", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.installToolchain("stable-x86_64-pc-windows-msvc")).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable-x86_64-pc-windows-msvc"], undefined],
        ]);
    });

    it("installToolchain components", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                components: ["clippy", "rust-doc"],
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable", "--component", "clippy", "--component", "rust-doc"],
                undefined,
            ],
        ]);
    });

    it("installToolchain noSelfUpdate", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                noSelfUpdate: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable", "--no-self-update"], undefined],
        ]);
    });

    it("installToolchain allowDowngrade", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                allowDowngrade: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable", "--allow-downgrade"], undefined],
        ]);
    });

    it("installToolchain force", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                force: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable", "--force"], undefined],
        ]);
    });

    it("installToolchain default", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                default: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable"], undefined],
            ["/home/user/.cargo/bin/rustup", ["default", "stable"], undefined],
        ]);
    });

    it("installToolchain override", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                override: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable"], undefined],
            ["/home/user/.cargo/bin/rustup", ["override", "set", "stable"], undefined],
        ]);
    });

    it("addTarget", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.addTarget("x86_64-apple-darwin")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["target", "add", "x86_64-apple-darwin"], undefined],
        ]);
    });

    it("addTarget forToolchain", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.addTarget("x86_64-apple-darwin", "nightly")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["target", "add", "--toolchain", "nightly", "x86_64-apple-darwin"],
                undefined,
            ],
        ]);
    });

    it("which", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(
                Buffer.from("/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo"),
            );

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.which("cargo")).resolves.toEqual(
            "/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo",
        );
    });

    it("which", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stderr?.(
                Buffer.from(
                    "error: not a file: '/home/kristof/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/clippy'",
                ),
            );

            return Promise.resolve(1);
        });

        expect.assertions(1);

        await expect(rustup.which("clippy")).rejects.toThrowError('Unable to find "clippy"');
    });

    it("setProfile", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.setProfile("full")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([["/home/user/.cargo/bin/rustup", ["set", "profile", "full"], undefined]]);
    });

    it("selfUpdate", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.selfUpdate()).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([["/home/user/.cargo/bin/rustup", ["self", "update"], undefined]]);
    });

    it("activeToolchain", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("stable-x86_64-unknown-linux-gnu (default)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.activeToolchain()).resolves.toEqual("stable-x86_64-unknown-linux-gnu");
    });

    it("activeToolchain none set", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, _options) => {
            return Promise.resolve(1);
        });

        expect.assertions(1);

        await expect(rustup.activeToolchain()).rejects.toThrowError("Unable to determine active toolchain");
    });

    it("version", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.version()).resolves.toEqual("1.26.0");
    });

    it("version none set", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, _options) => {
            return Promise.resolve(1);
        });

        expect.assertions(1);

        await expect(rustup.version()).rejects.toThrowError("Unable to determine version");
    });

    it("supportProfiles", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.supportProfiles()).resolves.toEqual(true);
    });

    it("supportProfiles fail", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.supportProfiles()).resolves.toEqual(false);
    });

    it("supportComponents", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.supportComponents()).resolves.toEqual(true);
    });

    it("supportComponents fail", async () => {
        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _args, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"));

            return Promise.resolve(0);
        });

        expect.assertions(1);

        await expect(rustup.supportComponents()).resolves.toEqual(false);
    });
});
