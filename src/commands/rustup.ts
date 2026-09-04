import { promises as fs } from "node:fs";
import { platform } from "node:os";
import path from "node:path";

import { addPath, debug, info } from "@actions/core";
import type { ExecOptions } from "@actions/exec";
import { exec } from "@actions/exec";
import { which } from "@actions/io";
import { downloadTool } from "@actions/tool-cache";
import { gte } from "semver";

import { readConfig } from "../config";

const PROFILES_MIN_VERSION = "1.20.1";
const COMPONENTS_MIN_VERSION = "1.20.1";

type Profile = "default" | "full" | "minimal";

export interface ToolchainOptions {
    allowDowngrade?: boolean;
    components?: string[];
    default?: boolean;
    force?: boolean;
    noSelfUpdate?: boolean;
    override?: boolean;
}

export class RustUp {
    private readonly path: string;

    private constructor(exePath: string) {
        this.path = exePath;
    }

    // Will throw an error if `rustup` is not installed.
    public static async get(): Promise<RustUp> {
        const exePath = await which("rustup", true);

        return new RustUp(exePath);
    }

    public static async getOrInstall(): Promise<RustUp> {
        try {
            return await RustUp.get();
        } catch (error: unknown) {
            debug(`Unable to find "rustup" executable, installing it now. Reason: ${String(error)}`);
            return RustUp.install();
        }
    }

    public static async install(): Promise<RustUp> {
        const { HOME } = readConfig();

        const args = [
            "--default-toolchain",
            "none",
            "-y", // No need for the prompts (hard error from within the Docker containers)
        ];

        const currentPlatform = platform();

        // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- the default arm rejects every platform rustup has no installer for
        switch (currentPlatform) {
            case "darwin":
            case "linux": {
                const rustupSh = await downloadTool("https://sh.rustup.rs");

                // While the `rustup-init.sh` is properly executed as is,
                // when Action is running on the VM itself,
                // it fails with `EACCES` when called in the Docker container.
                // Adding the execution bit manually just in case.
                // See: https://github.com/actions-rs/toolchain/pull/19#issuecomment-543358693
                debug(`Executing chmod 755 on the ${rustupSh}`);
                await fs.chmod(rustupSh, 0o755);

                await exec(rustupSh, args);
                break;
            }

            case "win32": {
                const rustupExe = await downloadTool("https://win.rustup.rs");
                await exec(rustupExe, args);
                break;
            }

            default: {
                throw new Error(`Unknown platform ${currentPlatform}, can't install rustup`);
            }
        }

        // rustup-init installs into `$HOME/.cargo/bin`
        addPath(path.join(HOME, ".cargo", "bin"));

        // Assuming it is in the $PATH already
        return new RustUp("rustup");
    }

    public async activeToolchain(): Promise<string> {
        const stdout = await this.callStdout(["show", "active-toolchain"]);

        const split = stdout.split(" ", 2)[0];

        if (split === undefined || split === "") {
            throw new Error("Unable to determine active toolchain");
        }

        return split;
    }

    public async addTarget(name: string, forToolchain?: string): Promise<number> {
        const args = ["target", "add"];

        if (forToolchain !== undefined) {
            args.push("--toolchain", forToolchain);
        }
        args.push(name);

        return this.call(args);
    }

    public async call(args: string[], options?: ExecOptions): Promise<number> {
        return exec(this.path, args, options);
    }

    /**
     * Call the `rustup` and return the stdout.
     *
     * @param {string[]} args Optional arguments for tool. Escaping is handled by the lib.
     * @param {ExecOptions[]} options Optional exec options. See `ExecOptions`.
     * @returns {Promise<string>} `stdout` of the execution of call.
     */
    public async callStdout(args: string[], options?: ExecOptions): Promise<string> {
        let stdout = "";
        const stdoutOptions = {
            ...options,
            listeners: {
                stdout: (buffer: Buffer): void => {
                    stdout += buffer.toString();
                },
            },
        };

        await this.call(args, stdoutOptions);

        return stdout;
    }

    public async installToolchain(name: string, options?: ToolchainOptions): Promise<number> {
        const args = ["toolchain", "install", name];

        if (options !== undefined) {
            const components = options.components ?? [];

            for (const component of components) {
                args.push("--component", component);
            }

            if (options.noSelfUpdate === true) {
                args.push("--no-self-update");
            }

            if (options.allowDowngrade === true) {
                args.push("--allow-downgrade");
            }

            if (options.force === true) {
                args.push("--force");
            }
        }

        await this.call(args);

        if (options?.default === true) {
            await this.call(["default", name]);
        }

        if (options?.override === true) {
            await this.call(["override", "set", name]);
        }

        return 0;
    }

    public async selfUpdate(): Promise<number> {
        return this.call(["self", "update"]);
    }

    /**
     * Executes `rustup set profile ${name}`
     *
     * Note that it includes the check if currently installed rustup support profiles at all
     *
     * @param {Profile} name The profile
     * @returns {Promise<number>} Exitcode of the `rustup set profile ${name}` call.
     */
    public async setProfile(name: Profile): Promise<number> {
        return this.call(["set", "profile", name]);
    }

    public async supportComponents(): Promise<boolean> {
        const version = await this.version();
        const supports = gte(version, COMPONENTS_MIN_VERSION);

        if (supports) {
            info(`Installed rustup ${version} support components`);
        } else {
            info(`Installed rustup ${version} does not support components, \
expected at least ${PROFILES_MIN_VERSION}`);
        }

        return supports;
    }

    public async supportProfiles(): Promise<boolean> {
        const version = await this.version();
        const supports = gte(version, PROFILES_MIN_VERSION);

        if (supports) {
            info(`Installed rustup ${version} support profiles`);
        } else {
            info(`Installed rustup ${version} does not support profiles, expected at least ${PROFILES_MIN_VERSION}`);
        }

        return supports;
    }

    public async version(): Promise<string> {
        const stdout = await this.callStdout(["-V"]);

        const [, split] = stdout.split(" ", 2);

        if (split === undefined) {
            throw new Error("Unable to determine version");
        }

        return split;
    }

    // rustup which `program`
    public async which(program: string): Promise<string> {
        const stdout = await this.callStdout(["which", program]);

        if (stdout === "") {
            throw new Error(`Unable to find "${program}"`);
        }

        return stdout;
    }
}
