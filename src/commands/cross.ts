import { tmpdir } from "node:os";

import { debug } from "@actions/core";
import { which } from "@actions/io";

import { BaseProgram } from "./base-program";
import { Cargo } from "./cargo";

export class Cross extends BaseProgram {
    private constructor(path: string) {
        super(path);
    }

    public static async get(): Promise<Cross> {
        const path = await which("cross", true);

        return new Cross(path);
    }

    public static async getOrInstall(): Promise<Cross> {
        try {
            return await Cross.get();
        } catch (error: unknown) {
            debug(String(error));
            return Cross.install();
        }
    }

    public static async install(version?: string): Promise<Cross> {
        const cargo = await Cargo.get();

        // Somewhat new Rust is required to compile `cross`
        // (TODO: Not sure what version exactly, should clarify)
        // but if some action will set an override toolchain before this action called
        // (ex. `@actions-rs/toolchain` with `toolchain: 1.31.0`)
        // `cross` compilation will fail.
        //
        // In order to skip this problem and install `cross` globally
        // using the pre-installed system Rust,
        // we are going to jump to the tmpdir (skipping directory override that way)
        // install `cross` from there and then jump back.

        const cwd = process.cwd();
        process.chdir(tmpdir());

        try {
            const crossPath = await cargo.installCached("cross", version);
            return new Cross(crossPath);
        } finally {
            // It is important to chdir back!
            process.chdir(cwd);
        }
    }
}
