import { promises as fs } from "fs";
import * as path from "path";
import * as process from "process";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as semver from "semver";

const PROFILES_MIN_VERSION = "1.20.1";
const COMPONENTS_MIN_VERSION = "1.20.1";

type Profile = "default" | "full" | "minimal";

export interface ToolchainOptions {
    default?: boolean;
    override?: boolean;
    components?: string[];
    noSelfUpdate?: boolean;
    allowDowngrade?: boolean;
    force?: boolean;
}

export class RustUp {
    private readonly path: string;

    private constructor(exePath: string) {
        this.path = exePath;
    }

    public static async getOrInstall(): Promise<RustUp> {
        try {
            return await RustUp.get();
        } catch (error: unknown) {
            core.debug(`Unable to find "rustup" executable, installing it now. Reason: ${String(error)}`);
            return await RustUp.install();
        }
    }

    // Will throw an error if `rustup` is not installed.
    public static async get(): Promise<RustUp> {
        const exePath = await io.which("rustup", true);

        return new RustUp(exePath);
    }

    public static async install(): Promise<RustUp> {
        const args = [
            "--default-toolchain",
            "none",
            "-y", // No need for the prompts (hard error from within the Docker containers)
        ];

        switch (process.platform) {
            case "darwin":
            case "linux": {
                const rustupSh = await tc.downloadTool("https://sh.rustup.rs");

                // While the `rustup-init.sh` is properly executed as is,
                // when Action is running on the VM itself,
                // it fails with `EACCES` when called in the Docker container.
                // Adding the execution bit manually just in case.
                // See: https://github.com/actions-rs/toolchain/pull/19#issuecomment-543358693
                core.debug(`Executing chmod 755 on the ${rustupSh}`);
                await fs.chmod(rustupSh, 0o755);

                await exec.exec(rustupSh, args);
                break;
            }

            case "win32": {
                const rustupExe = await tc.downloadTool("https://win.rustup.rs");
                await exec.exec(rustupExe, args);
                break;
            }

            default:
                throw new Error(`Unknown platform ${process.platform}, can't install rustup`);
        }

        // `$HOME` should always be declared, so it is more to get the linters happy
        core.addPath(path.join(process.env["HOME"]!, ".cargo", "bin")); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        // Assuming it is in the $PATH already
        return new RustUp("rustup");
    }

    public async installToolchain(name: string, options?: ToolchainOptions): Promise<number> {
        const args = ["toolchain", "install", name];

        if (options) {
            if (options.components && options.components.length > 0) {
                for (const component of options.components) {
                    args.push("--component");
                    args.push(component);
                }
            }

            if (options.noSelfUpdate) {
                args.push("--no-self-update");
            }

            if (options.allowDowngrade) {
                args.push("--allow-downgrade");
            }

            if (options.force) {
                args.push("--force");
            }
        }

        await this.call(args);

        if (options?.default) {
            await this.call(["default", name]);
        }

        if (options?.override) {
            await this.call(["override", "set", name]);
        }

        // TODO: Is there smth like Rust' `return Ok(())`?
        return 0;
    }

    public addTarget(name: string, forToolchain?: string): Promise<number> {
        const args = ["target", "add"];

        if (forToolchain) {
            args.push("--toolchain");
            args.push(forToolchain);
        }
        args.push(name);

        return this.call(args);
    }

    public async activeToolchain(): Promise<string> {
        const stdout = await this.callStdout(["show", "active-toolchain"]);

        const split = stdout?.split(" ", 2)[0];

        if (split) {
            return split;
        } else {
            throw new Error("Unable to determine active toolchain");
        }
    }

    public async supportProfiles(): Promise<boolean> {
        const version = await this.version();
        const supports = semver.gte(version, PROFILES_MIN_VERSION);
        if (supports) {
            core.info(`Installed rustup ${version} support profiles`);
        } else {
            core.info(`Installed rustup ${version} does not support profiles, \
expected at least ${PROFILES_MIN_VERSION}`);
        }
        return supports;
    }

    public async supportComponents(): Promise<boolean> {
        const version = await this.version();
        const supports = semver.gte(version, COMPONENTS_MIN_VERSION);
        if (supports) {
            core.info(`Installed rustup ${version} support components`);
        } else {
            core.info(`Installed rustup ${version} does not support components, \
expected at least ${PROFILES_MIN_VERSION}`);
        }
        return supports;
    }

    /**
     * Executes `rustup set profile ${name}`
     *
     * Note that it includes the check if currently installed rustup support profiles at all
     */
    public setProfile(name: Profile): Promise<number> {
        return this.call(["set", "profile", name]);
    }

    public async version(): Promise<string> {
        const stdout = await this.callStdout(["-V"]);

        const split = stdout?.split(" ")[1];

        if (split) {
            return split;
        } else {
            throw new Error("Unable to determine version");
        }
    }

    // rustup which `program`
    public async which(program: string): Promise<string> {
        const stdout = await this.callStdout(["which", program]);

        if (stdout) {
            return stdout;
        } else {
            throw new Error(`Unable to find "${program}"`);
        }
    }

    public selfUpdate(): Promise<number> {
        return this.call(["self", "update"]);
    }

    public call(args: string[], options?: exec.ExecOptions): Promise<number> {
        return exec.exec(this.path, args, options);
    }

    /**
     * Call the `rustup` and return an stdout
     */
    public async callStdout(args: string[], options?: exec.ExecOptions): Promise<string> {
        let stdout = "";
        const resOptions = Object.assign({}, options, {
            listeners: {
                stdout: (buffer: Buffer): void => {
                    stdout += buffer.toString();
                },
            },
        });

        await this.call(args, resOptions);

        return stdout;
    }
}
