import type { ExecOptions } from "@actions/exec";
import { exec } from "@actions/exec";

export abstract class BaseProgram {
    protected readonly path: string;

    protected constructor(path: string) {
        this.path = path;
    }

    public call(arguments_: string[], options?: ExecOptions): Promise<number> {
        return exec(this.path, arguments_, options);
    }
}
