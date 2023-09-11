import { getOctokit } from "@actions/github";

import * as github from "@actions/github";

import { Check } from "checks";

// jest.mock("@actions/github");

describe("check", () => {
    beforeEach(() => {
        github.context.sha = "sha";

        jest.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("startCheck", async () => {
        expect.assertions(2);

        const client = jest.mocked(getOctokit("token"));

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const createSpy = jest.spyOn(client.rest.checks, "create").mockResolvedValue({
            data: { id: 5 },
        } as Awaited<ReturnType<typeof client.rest.checks.create>>);

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
        const client = jest.mocked(getOctokit("token"));

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        jest.spyOn(client.rest.checks, "create").mockResolvedValue({
            data: { id: 5 },
        } as Awaited<ReturnType<typeof client.rest.checks.create>>);

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        jest.spyOn(client.rest.checks, "update").mockResolvedValue({
            data: { id: 5 },
        } as Awaited<ReturnType<typeof client.rest.checks.update>>);

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.cancelCheck()).resolves.toBe(undefined);
    });

    it("finishCheck", async () => {
        const client = jest.mocked(getOctokit("token"));

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        jest.spyOn(client.rest.checks, "create").mockResolvedValue({
            data: { id: 5 },
        } as Awaited<ReturnType<typeof client.rest.checks.create>>);

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        jest.spyOn(client.rest.checks, "update").mockResolvedValue({
            data: { id: 5 },
        } as Awaited<ReturnType<typeof client.rest.checks.update>>);

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.finishCheck("success", { summary: "Summary", text: "text", title: "title" })).resolves.toBe(undefined);
    });
});
