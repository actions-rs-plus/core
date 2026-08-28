import path from "node:path";

import { ReserveCacheError, restoreCache, saveCache, ValidationError } from "@actions/cache";
import { endGroup, info, error as logError, startGroup, warning } from "@actions/core";
import { which } from "@actions/io";

import { BaseProgram } from "./base-program";
import { resolveVersion } from "./crates";

export class Cargo extends BaseProgram {
    private constructor(pathToCargo: string) {
        super(pathToCargo);
    }

    public static async get(): Promise<Cargo> {
        try {
            const pathToCargo = await which("cargo", true);

            return new Cargo(pathToCargo);
        } catch (error) {
            logError(
                "cargo is not installed by default for some virtual environments, see https://help.github.com/en/articles/software-in-virtual-environments-for-github-actions",
            );
            logError("To install it, use this action: https://github.com/actions-rs/toolchain");

            throw error;
        }
    }

    /**
     * Find the cargo sub-command or install it
     *
     * @param {string} program The program to install (e.g. `cross`)
     * @param {string} version The version to install (e.g. `1.2.3`). Defaults to `latest` when omitted.
     * @returns {Promise<string>} `program`, verbatim.
     */
    public async findOrInstall(program: string, version?: string): Promise<string> {
        try {
            void (await which(program, true));

            return program;
        } catch {
            info(`${program} is not installed, installing it now`);
        }

        return this.installCached(program, version);
    }

    public async install(program: string, version?: string): Promise<string> {
        const args = ["install"];

        if (version !== undefined && version !== "latest") {
            args.push("--version", version);
        }

        args.push(program);

        startGroup(`Installing "${program} = ${version ?? "latest"}"`);

        try {
            await this.call(args);
        } finally {
            endGroup();
        }

        return program;
    }

    /**
     * Executes `cargo install ${program}`.
     *
     * TODO: Caching ability implementation is blocked, see https://github.com/actions-rs/core/issues/31 As for now it
     * acts just like an stub and simply installs the program on each call.
     *
     * `version` argument could be either actual program version or `"latest"` string, which can be provided by user
     * input.
     *
     * If `version` is `undefined` or `"latest"`, this method could call the Crates.io API, fetch the latest version and
     * search for it in cache. TODO: Actually implement this.
     *
     * ## Returns
     *
     * Path to the installed program. As the $PATH should be already tuned properly at this point, returned value at the
     * moment is simply equal to the `program` argument.
     *
     * @param {string} program The program to install (e.g. `cross`)
     * @param {string} version The version to install (e.g. `1.2.3`). Defaults to `latest` when omitted.
     * @param {string} primaryKey An explicit key for restoring the cache. Lookup is done with prefix matching.
     * @param {string[]} restoreKeys An optional ordered list of keys to use for restoring the cache if no cache hit
     *   occurred for primaryKey
     * @returns {Promise<string>} `program`, verbatim.
     */
    public async installCached(
        program: string,
        version?: string,
        primaryKey?: string,
        restoreKeys: string[] = [],
    ): Promise<string> {
        const resolvedVersion = version === "latest" ? await resolveVersion(program) : version;

        if (primaryKey === undefined) {
            return this.install(program, resolvedVersion);
        }

        const paths = [path.join(path.dirname(this.path), program)];

        const versionForKey = resolvedVersion === undefined ? "" : `-${resolvedVersion}`;

        const programKey = `${program}${versionForKey}-${primaryKey}`;

        const programRestoreKeys = restoreKeys.map((key) => {
            return `${program}${versionForKey}-${key}`;
        });

        const cacheKey = await restoreCache(paths, programKey, programRestoreKeys);

        if (cacheKey !== undefined) {
            info(`Using cached \`${program}\` with version ${resolvedVersion ?? "installed-version"} from ${cacheKey}`);
            return program;
        }

        const result = await this.install(program, resolvedVersion);

        try {
            info(`Caching \`${program}\` with key ${programKey}`);
            await saveCache(paths, programKey);
        } catch (error: unknown) {
            if (Error.isError(error)) {
                if (error.name === ValidationError.name) {
                    throw error;
                }

                if (error.name === ReserveCacheError.name) {
                    warning(error.message);
                }
            } else if (typeof error === "string") {
                warning(error);
            } else {
                throw error;
            }
        }

        return result;
    }
}
