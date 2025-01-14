import * as github from "@actions/github";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Check } from "@/checks";

function getMockedClient(): ReturnType<typeof github.getOctokit> {
    type T0 = Awaited<ReturnType<ReturnType<typeof github.getOctokit>["rest"]["checks"]["create"]>>;

    const fakeResult1: T0 = {
        headers: {},
        status: 201 as const,
        url: "",
        data: {
            id: 5,
            head_sha: "",
            node_id: "",
            external_id: null,
            url: "",
            html_url: null,
            details_url: null,
            status: "queued" as const,
            conclusion: null,
            started_at: null,
            completed_at: null,
            output: { title: null, summary: null, text: null, annotations_count: 0, annotations_url: "" },
            check_suite: null,
            app: null,
            pull_requests: [],
            name: "",
        },
    };

    const fakeResult2 = {
        ...fakeResult1,
        status: 200 as const,
    };

    const client = github.getOctokit("token");

    vi.spyOn(client.rest.checks, "create").mockResolvedValue(fakeResult1);
    vi.spyOn(client.rest.checks, "update").mockResolvedValue(fakeResult2);

    return client;
}

describe("check", () => {
    beforeEach(() => {
        github.context.sha = "sha";

        vi.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("startCheck", async () => {
        expect.assertions(2);

        const client = getMockedClient();

        const createSpy = vi.spyOn(client.rest.checks, "create");

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        expect(check).toBeInstanceOf(Check);
        expect(createSpy.mock.calls).toMatchObject([
            [
                {
                    head_sha: "sha",
                    name: "check-name",
                    owner: "owner",
                    repo: "repo",
                    status: "in_progress",
                },
            ],
        ]);
    });

    it("cancelCheck", async () => {
        const client = getMockedClient();

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.cancelCheck()).resolves.toBe(undefined);
    });

    it("finishCheck", async () => {
        const client = getMockedClient();

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(
            check.finishCheck("success", {
                summary: "Summary",
                text: "text",
                title: "title",
            }),
        ).resolves.toBe(undefined);
    });
});
