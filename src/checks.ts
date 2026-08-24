import { context } from "@actions/github";
import type { GitHub as GitHubClass } from "@actions/github/lib/utils";

type GitHub = InstanceType<typeof GitHubClass>;

interface Output {
    summary: string;
    text: string;
    title: string;
}

/** Thin wrapper around the GitHub Checks API */
export class Check {
    private readonly checkId: number;
    private readonly checkName: string;
    private readonly client: GitHub;

    private constructor(client: GitHub, checkName: string, checkId: number) {
        this.client = client;
        this.checkName = checkName;
        this.checkId = checkId;
    }

    /**
     * Starts a new Check and returns check ID.
     *
     * @param {GitHub} client A configured GitHub Client.
     * @param {string} checkName Name of the check.
     * @param {string} status Status of the check, optional.
     * @returns {Check} Object representing the check on GitHub.
     */
    public static async startCheck(
        client: GitHub,
        checkName: string,
        status: "completed" | "in_progress" | "queued" = "in_progress",
    ): Promise<Check> {
        const { owner, repo } = context.repo;

        const response = await client.rest.checks.create({
            owner,
            repo,
            name: checkName,
            head_sha: context.sha,
            status,
        });
        // TODO: Check for errors

        return new Check(client, checkName, response.data.id);
    }
    // TODO:
    //     public async sendAnnotations(annotations: Array<octokit.ChecksCreateParamsOutputAnnotations>): Promise<void> {
    //     }

    public async cancelCheck(): Promise<void> {
        const { owner, repo } = context.repo;

        const now = new Date();

        // TODO: Check for errors
        await this.client.rest.checks.update({
            owner,
            repo,
            name: this.checkName,
            check_run_id: this.checkId,
            status: "completed",
            conclusion: "cancelled",
            completed_at: now.toISOString(),
            output: {
                title: this.checkName,
                summary: "Unhandled error",
                text: "Check was cancelled due to unhandled error. Check the Action logs for details.",
            },
        });
    }

    public async finishCheck(
        conclusion: "action_required" | "cancelled" | "failure" | "neutral" | "success" | "timed_out",
        output: Output,
    ): Promise<void> {
        const { owner, repo } = context.repo;

        const now = new Date();

        // TODO: Check for errors
        await this.client.rest.checks.update({
            owner,
            repo,
            name: this.checkName,
            check_run_id: this.checkId,
            status: "completed",
            conclusion,
            completed_at: now.toISOString(),
            output,
        });
    }
}
