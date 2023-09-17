import * as exec from "@actions/exec";

export abstract class BaseProgram {
    protected readonly path: string;

    protected constructor(path: string) {
        this.path = path;
    }

    public call(args: string[], options?: exec.ExecOptions): Promise<number> {
        return exec.exec(this.path, args, options);
    }
}
