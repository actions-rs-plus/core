import github from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils.js";

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
            owner,
            repo,
            name: checkName,
            head_sha: github.context.sha,
            status,
        });
        // TODO: Check for errors

        return new Check(client, checkName, response.data.id);
    }

    public async finishCheck(
        conclusion: "action_required" | "cancelled" | "failure" | "neutral" | "success" | "timed_out",
        output: Output,
    ): Promise<void> {
        const { owner, repo } = github.context.repo;

        // TODO: Check for errors
        await this.client.rest.checks.update({
            owner,
            repo,
            name: this.checkName,
            check_run_id: this.checkId,
            status: "completed",
            conclusion,
            completed_at: new Date().toISOString(),
            output,
        });
    }

    public async cancelCheck(): Promise<void> {
        const { owner, repo } = github.context.repo;

        // TODO: Check for errors
        await this.client.rest.checks.update({
            owner,
            repo,
            name: this.checkName,
            check_run_id: this.checkId,
            status: "completed",
            conclusion: "cancelled",
            completed_at: new Date().toISOString(),
            output: {
                title: this.checkName,
                summary: "Unhandled error",
                text: "Check was cancelled due to unhandled error. Check the Action logs for details.",
            },
        });
    }
}
