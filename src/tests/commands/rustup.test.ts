import { promises as fs } from "node:fs";

// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as core from "@actions/core";
// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as exec from "@actions/exec";
// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as io from "@actions/io";
// oxlint-disable-next-line import/no-namespace -- `vi.spyOn` patches a property on the module object
import * as tc from "@actions/tool-cache";
import { describe, expect, it, test, vi } from "vitest";

import { RustUp } from "../../core";

const osMocks = vi.hoisted(() => {
    return {
        platform: vi.fn().mockReturnValue("linux"),
    };
});

vi.mock(import("node:os"), async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, platform: osMocks.platform };
});

vi.setConfig({ testTimeout: 1000 });

describe("rustup", () => {
    it("get", async () => {
        expect.assertions(2);

        const spy = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        await expect(RustUp.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("getOrInstall install", async () => {
        expect.assertions(4);

        // prepare instance to return after installation
        const prepared = vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        const rustup = await RustUp.get();
        prepared.mockClear();

        // actual test
        const spy1 = vi.spyOn(io, "which").mockRejectedValue(new Error("Could not find path to rustup"));
        const spy2 = vi.spyOn(RustUp, "install").mockResolvedValueOnce(rustup);
        // oxlint-disable-next-line no-empty-function -- mock
        const spy3 = vi.spyOn(core, "debug").mockImplementation(() => {});

        await expect(RustUp.getOrInstall()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
    });

    it("install unknown platform", async () => {
        expect.assertions(1);

        osMocks.platform.mockReturnValueOnce("sunos");

        await expect(RustUp.install()).rejects.toThrow(/Unknown platform/v);
    });

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion -- it does not here
    test.each([["linux" as typeof process.platform], ["darwin" as typeof process.platform]])(
        "install %s",
        async (platform: typeof process.platform) => {
            expect.assertions(3);

            vi.spyOn(fs, "chmod").mockResolvedValueOnce();
            vi.spyOn(core, "debug").mockResolvedValueOnce();
            vi.spyOn(core, "addPath").mockResolvedValueOnce();

            osMocks.platform.mockReturnValueOnce(platform);

            const downloadSpy = vi.spyOn(tc, "downloadTool").mockResolvedValueOnce("/tmp/rustup.sh");
            const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

            await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
            expect(downloadSpy.mock.calls).toEqual([["https://sh.rustup.rs"]]);
            expect(execSpy.mock.calls).toEqual([["/tmp/rustup.sh", ["--default-toolchain", "none", "-y"]]]);
        },
    );

    it("install win32", async () => {
        expect.assertions(4);

        osMocks.platform.mockReturnValueOnce("win32");
        const downloadSpy = vi.spyOn(tc, "downloadTool").mockResolvedValueOnce(String.raw`C:\TEMP\rustup.exe`);
        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);
        const addpathSpy = vi.spyOn(core, "addPath").mockResolvedValue();

        await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
        expect(downloadSpy.mock.calls).toEqual([["https://win.rustup.rs"]]);
        expect(execSpy.mock.calls).toEqual([[String.raw`C:\TEMP\rustup.exe`, ["--default-toolchain", "none", "-y"]]]);
        expect(addpathSpy).toHaveBeenCalledTimes(1);
    });

    it("installToolchain", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        await expect(rustup.installToolchain("stable")).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable"], undefined],
        ]);
    });

    it("installToolchain stable-x86_64-pc-windows-msvc", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        await expect(rustup.installToolchain("stable-x86_64-pc-windows-msvc")).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["toolchain", "install", "stable-x86_64-pc-windows-msvc"], undefined],
        ]);
    });

    it("installToolchain components", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0).mockResolvedValueOnce(0);

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
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        await expect(rustup.addTarget("x86_64-apple-darwin")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["target", "add", "x86_64-apple-darwin"], undefined],
        ]);
    });

    it("addTarget forToolchain", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

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
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(
                Buffer.from("/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo"),
            );

            return Promise.resolve(0);
        });

        await expect(rustup.which("cargo")).resolves.toEqual(
            "/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo",
        );
    });

    it("which", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stderr?.(
                Buffer.from(
                    "error: not a file: '/home/kristof/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/clippy'",
                ),
            );

            return Promise.resolve(1);
        });

        await expect(rustup.which("clippy")).rejects.toThrow('Unable to find "clippy"');
    });

    it("setProfile", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        await expect(rustup.setProfile("full")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([["/home/user/.cargo/bin/rustup", ["set", "profile", "full"], undefined]]);
    });

    it("selfUpdate", async () => {
        expect.assertions(2);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        const execSpy = vi.spyOn(exec, "exec").mockResolvedValueOnce(0);

        await expect(rustup.selfUpdate()).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([["/home/user/.cargo/bin/rustup", ["self", "update"], undefined]]);
    });

    it("activeToolchain", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("stable-x86_64-unknown-linux-gnu (default)"));

            return Promise.resolve(0);
        });

        await expect(rustup.activeToolchain()).resolves.toEqual("stable-x86_64-unknown-linux-gnu");
    });

    it("activeToolchain none set", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, _options) => {
            return Promise.resolve(1);
        });

        await expect(rustup.activeToolchain()).rejects.toThrow("Unable to determine active toolchain");
    });

    it("version", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        await expect(rustup.version()).resolves.toEqual("1.26.0");
    });

    it("version none set", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, _options) => {
            return Promise.resolve(1);
        });

        await expect(rustup.version()).rejects.toThrow("Unable to determine version");
    });

    it("supportProfiles", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        vi.spyOn(core, "info").mockResolvedValueOnce();

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        await expect(rustup.supportProfiles()).resolves.toEqual(true);
    });

    it("supportProfiles fail", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        vi.spyOn(core, "info").mockResolvedValueOnce();

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"));

            return Promise.resolve(0);
        });

        await expect(rustup.supportProfiles()).resolves.toEqual(false);
    });

    it("supportComponents", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        vi.spyOn(core, "info").mockResolvedValueOnce();

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"));

            return Promise.resolve(0);
        });

        await expect(rustup.supportComponents()).resolves.toEqual(true);
    });

    it("supportComponents fail", async () => {
        expect.assertions(1);

        vi.spyOn(io, "which").mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        vi.spyOn(core, "info").mockResolvedValueOnce();

        const rustup = await RustUp.get();

        vi.spyOn(exec, "exec").mockImplementationOnce((_commandLine, _arguments, options) => {
            options?.listeners?.stdout?.(Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"));

            return Promise.resolve(0);
        });

        await expect(rustup.supportComponents()).resolves.toEqual(false);
    });
});
