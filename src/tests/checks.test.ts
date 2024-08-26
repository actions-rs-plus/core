import * as github from "@actions/github";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Check } from "@/checks";

describe("check", () => {
    beforeEach(() => {
        const fakeResult = {
            data: {
                id: 5,
            },
        };

        github.context.sha = "sha";

        vi.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });

        const client = github.getOctokit("token");

        vi.spyOn(github, "getOctokit").mockReturnValue({
            ...client,
            rest: {
                ...client.rest,
                checks: {
                    create: vi.fn().mockResolvedValue(fakeResult),
                    update: vi.fn().mockResolvedValue(fakeResult),
                } as unknown as ReturnType<typeof github.getOctokit>["rest"]["checks"],
            },
        });
    });

    it("startCheck", async () => {
        expect.assertions(2);

        const client = github.getOctokit("token");

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
        const client = github.getOctokit("token");

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.cancelCheck()).resolves.toBe(undefined);
    });

    it("finishCheck", async () => {
        const client = github.getOctokit("token");

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
