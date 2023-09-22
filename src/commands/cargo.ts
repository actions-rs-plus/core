import * as path from "path";

import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as http from "@actions/http-client";
import * as io from "@actions/io";

import type { CratesIO } from "../schema";

import { BaseProgram } from "./base-program";

export async function resolveVersion(crate: string): Promise<string> {
    const url = `https://crates.io/api/v1/crates/${crate}`;
    const client = new http.HttpClient("@actions-rs-plus (https://github.com/actions-rs-plus/)");

    const resp = await client.getJson<CratesIO>(url);

    if (resp.statusCode === 404) {
        throw new Error("Could not find package");
    }

    if (!resp.result) {
        throw new Error("Unable to fetch latest crate version");
    }

    if ("errors" in resp.result || !resp.result?.crate?.newest_version) {
        core.error("Unable to fetch latest crate version: ");
        core.error(JSON.stringify(resp.result, null, 2));

        throw new Error("Unable to fetch latest crate version");
    }

    return resp.result.crate.newest_version;
}

export class Cargo extends BaseProgram {
    private constructor(pathToCargo: string) {
        super(pathToCargo);
    }

    public static async get(): Promise<Cargo> {
        try {
            const pathToCargo = await io.which("cargo", true);

            return new Cargo(pathToCargo);
        } catch (error) {
            core.error("cargo is not installed by default for some virtual environments, see https://help.github.com/en/articles/software-in-virtual-environments-for-github-actions");
            core.error("To install it, use this action: https://github.com/actions-rs/toolchain");

            throw error;
        }
    }

    /**
     * Executes `cargo install ${program}`.
     *
     * TODO: Caching ability implementation is blocked,
     * see https://github.com/actions-rs/core/issues/31
     * As for now it acts just like an stub and simply installs the program
     * on each call.
     *
     * `version` argument could be either actual program version or `"latest"` string,
     * which can be provided by user input.
     *
     * If `version` is `undefined` or `"latest"`, this method could call the Crates.io API,
     * fetch the latest version and search for it in cache.
     * TODO: Actually implement this.
     *
     * ## Returns
     *
     * Path to the installed program.
     * As the $PATH should be already tuned properly at this point,
     * returned value at the moment is simply equal to the `program` argument.
     */
    public async installCached(program: string, version?: string, primaryKey?: string, restoreKeys: string[] = []): Promise<string> {
        if (version === "latest") {
            version = await resolveVersion(program);
        }

        if (primaryKey) {
            const paths = [path.join(path.dirname(this.path), program)];

            const programKey = `${program}-${version}-${primaryKey}`;

            const programRestoreKeys = restoreKeys.map((key) => {
                return `${program}-${version}-${key}`;
            });

            const cacheKey = await cache.restoreCache(paths, programKey, programRestoreKeys);

            if (cacheKey) {
                core.info(`Using cached \`${program}\` with version ${version} from ${cacheKey}`);
                return program;
            } else {
                const res = await this.install(program, version);

                try {
                    core.info(`Caching \`${program}\` with key ${programKey}`);
                    await cache.saveCache(paths, programKey);
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        if (error.name === cache.ValidationError.name) {
                            throw error;
                        } else if (error.name === cache.ReserveCacheError.name) {
                            core.warning(error.message);
                        }
                    } else if (typeof error === "string") {
                        core.warning(error);
                    } else {
                        throw error;
                    }
                }

                return res;
            }
        } else {
            return await this.install(program, version);
        }
    }

    public async install(program: string, version?: string): Promise<string> {
        const args = ["install"];

        if (version && version !== "latest") {
            args.push("--version");
            args.push(version);
        }

        args.push(program);

        try {
            core.startGroup(`Installing "${program} = ${version ?? "latest"}"`);
            await this.call(args);
        } finally {
            core.endGroup();
        }

        return program;
    }

    /**
     * Find the cargo sub-command or install it
     */
    public async findOrInstall(program: string, version?: string): Promise<string> {
        try {
            void (await io.which(program, true));

            return program;
        } catch (error) {
            core.info(`${program} is not installed, installing it now`);
        }

        return await this.installCached(program, version);
    }
}
