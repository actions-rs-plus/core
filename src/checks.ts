import github from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils";

interface Output {
    title: string;
    summary: string;
    text: string;
}

/**
 * Thin wrapper around the GitHub Checks API
 */
export class Check {
    private readonly client: InstanceType<typeof GitHub>;
    private readonly checkName: string;
    private readonly checkId: number;

    private constructor(client: InstanceType<typeof GitHub>, checkName: string, checkId: number) {
        this.client = client;
        this.checkName = checkName;
        this.checkId = checkId;
    }

    /**
     * Starts a new Check and returns check ID.
     */
    public static async startCheck(
        client: InstanceType<typeof GitHub>,
        checkName: string,
        status: "completed" | "in_progress" | "queued" = "in_progress",
    ): Promise<Check> {
        const { owner, repo } = github.context.repo;

        const response = await client.rest.checks.create({
            head_sha: github.context.sha,
            name: checkName,
            owner,
            repo,
            status,
        });
        // TODO: Check for errors

        return new Check(client, checkName, response.data.id);
    }
    // TODO:
    //     public async sendAnnotations(annotations: Array<octokit.ChecksCreateParamsOutputAnnotations>): Promise<void> {
    //     }

    public async finishCheck(
        conclusion: "action_required" | "cancelled" | "failure" | "neutral" | "success" | "timed_out",
        output: Output,
    ): Promise<void> {
        const { owner, repo } = github.context.repo;

        // TODO: Check for errors
        await this.client.rest.checks.update({
            check_run_id: this.checkId,
            completed_at: new Date().toISOString(),
            conclusion,
            name: this.checkName,
            output,
            owner,
            repo,
            status: "completed",
        });
    }

    public async cancelCheck(): Promise<void> {
        const { owner, repo } = github.context.repo;

        // TODO: Check for errors
        await this.client.rest.checks.update({
            check_run_id: this.checkId,
            completed_at: new Date().toISOString(),
            conclusion: "cancelled",
            name: this.checkName,
            output: {
                summary: "Unhandled error",
                text: "Check was cancelled due to unhandled error. Check the Action logs for details.",
                title: this.checkName,
            },
            owner,
            repo,
            status: "completed",
        });
    }
}
