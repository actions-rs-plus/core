import { promises as fs } from "fs";

import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";

import { RustUp } from "core";

jest.mock("@actions/io");
// jest.mock("fs");

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
        const spy = jest
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/rustup");

        await expect(RustUp.get()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("getOrInstall install", async () => {
        // prepare instance to return after installation
        const prepared = jest
            .spyOn(io, "which")
            .mockResolvedValueOnce("/home/user/.cargo/bin/rustup");
        const rustup = await RustUp.get();
        prepared.mockClear();

        // actual test
        const spy1 = jest
            .spyOn(io, "which")
            .mockRejectedValue(new Error("Could not find path to rustup"));
        const spy2 = jest
            .spyOn(RustUp, "install")
            .mockResolvedValueOnce(rustup);

        await expect(RustUp.getOrInstall()).resolves.toEqual({
            path: "/home/user/.cargo/bin/rustup",
        });

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });

    it("install unknown platform", async () => {
        Object.defineProperty(process, "platform", {
            value: "sunos",
        });

        expect.assertions(1);

        await expect(RustUp.install()).rejects.toThrow(/Unknown platform/);
    });

    test.each([
        ["linux" as typeof process.platform],
        ["darwin" as typeof process.platform],
    ])("install %s", async (platform: typeof process.platform) => {
        Object.defineProperty(process, "platform", {
            value: platform,
        });
        jest.spyOn(fs, "chmod").mockResolvedValueOnce();
        const downloadSpy = jest
            .spyOn(tc, "downloadTool")
            .mockResolvedValueOnce("/tmp/rustup.sh");
        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(3);

        await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
        expect(downloadSpy.mock.calls).toEqual([["https://sh.rustup.rs"]]);
        expect(execSpy.mock.calls).toEqual([
            ["/tmp/rustup.sh", ["--default-toolchain", "none", "-y"]],
        ]);
    });

    it("install win32", async () => {
        Object.defineProperty(process, "platform", {
            value: "win32",
        });

        const downloadSpy = jest
            .spyOn(tc, "downloadTool")
            .mockResolvedValueOnce("C:\\TEMP\\rustup.exe");
        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(3);

        await expect(RustUp.install()).resolves.toEqual({ path: "rustup" });
        expect(downloadSpy.mock.calls).toEqual([["https://win.rustup.rs"]]);
        expect(execSpy.mock.calls).toEqual([
            ["C:\\TEMP\\rustup.exe", ["--default-toolchain", "none", "-y"]],
        ]);
    });

    it("installToolchain", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.installToolchain("stable")).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable"],
            ],
        ]);
    });

    it("installToolchain stable-x86_64-pc-windows-msvc", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable-x86_64-pc-windows-msvc"),
        ).resolves.toEqual(0);
        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable-x86_64-pc-windows-msvc"],
            ],
        ]);
    });

    it("installToolchain components", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                components: ["clippy", "rust-doc"],
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                [
                    "toolchain",
                    "install",
                    "stable",
                    "--component",
                    "clippy",
                    "--component",
                    "rust-doc",
                ],
            ],
        ]);
    });

    it("installToolchain noSelfUpdate", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                noSelfUpdate: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable", "--no-self-update"],
            ],
        ]);
    });

    it("installToolchain allowDowngrade", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                allowDowngrade: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable", "--allow-downgrade"],
            ],
        ]);
    });

    it("installToolchain force", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                force: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable", "--force"],
            ],
        ]);
    });

    it("installToolchain default", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                default: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable"],
            ],
            ["/home/user/.cargo/bin/rustup", ["default", "stable"]],
        ]);
    });

    it("installToolchain override", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest
            .spyOn(exec, "exec")
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.installToolchain("stable", {
                override: true,
            }),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["toolchain", "install", "stable"],
            ],
            ["/home/user/.cargo/bin/rustup", ["override", "set", "stable"]],
        ]);
    });

    it("addTarget", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.addTarget("x86_64-apple-darwin")).resolves.toEqual(
            0,
        );

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                ["target", "add", "x86_64-apple-darwin"],
            ],
        ]);
    });

    it("addTarget forToolchain", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(
            rustup.addTarget("x86_64-apple-darwin", "nightly"),
        ).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            [
                "/home/user/.cargo/bin/rustup",
                [
                    "target",
                    "add",
                    "--toolchain",
                    "nightly",
                    "x86_64-apple-darwin",
                ],
            ],
        ]);
    });

    it("which", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from(
                        "/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo",
                    ),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.which("cargo")).resolves.toEqual(
            "/home/user/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo",
        );
    });

    it("which", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stderr?.(
                    Buffer.from(
                        "error: not a file: '/home/kristof/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/clippy'",
                    ),
                );

                return Promise.resolve(1);
            },
        );

        expect.assertions(1);

        await expect(rustup.which("clippy")).rejects.toThrowError(
            'Unable to find "clippy"',
        );
    });

    it("setProfile", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.setProfile("full")).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["set", "profile", "full"]],
        ]);
    });

    it("selfUpdate", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        const execSpy = jest.spyOn(exec, "exec").mockResolvedValueOnce(0);

        expect.assertions(2);

        await expect(rustup.selfUpdate()).resolves.toEqual(0);

        expect(execSpy.mock.calls).toEqual([
            ["/home/user/.cargo/bin/rustup", ["self", "update"]],
        ]);
    });

    it("activeToolchain", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("stable-x86_64-unknown-linux-gnu (default)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.activeToolchain()).resolves.toEqual(
            "stable-x86_64-unknown-linux-gnu",
        );
    });

    it("activeToolchain none set", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, _options) => {
                return Promise.resolve(1);
            },
        );

        expect.assertions(1);

        await expect(rustup.activeToolchain()).rejects.toThrowError(
            "Unable to determine active toolchain",
        );
    });

    it("version", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.version()).resolves.toEqual("1.26.0");
    });

    it("version none set", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, _options) => {
                return Promise.resolve(1);
            },
        );

        expect.assertions(1);

        await expect(rustup.version()).rejects.toThrowError(
            "Unable to determine version",
        );
    });

    it("supportProfiles", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.supportProfiles()).resolves.toEqual(true);
    });

    it("supportProfiles fail", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.supportProfiles()).resolves.toEqual(false);
    });

    it("supportComponents", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("rustup 1.26.0 (5af9b9484 2023-04-05)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.supportComponents()).resolves.toEqual(true);
    });

    it("supportComponents fail", async () => {
        jest.spyOn(io, "which").mockResolvedValueOnce(
            "/home/user/.cargo/bin/rustup",
        );

        const rustup = await RustUp.get();

        jest.spyOn(exec, "exec").mockImplementationOnce(
            (_commandLine, _args, options) => {
                options?.listeners?.stdout?.(
                    Buffer.from("rustup-init 1.18.3 (302899482 2019-05-22)"),
                );

                return Promise.resolve(0);
            },
        );

        expect.assertions(1);

        await expect(rustup.supportComponents()).resolves.toEqual(false);
    });
});
