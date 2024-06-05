import * as github from "@actions/github";

import { Check } from "@/checks";

// I hate doing thing like this, but it's the only way I could figure out on how
// to properly mock out the client.rest methods
vitest.mock("@octokit/plugin-rest-endpoint-methods", () => {
    return {
        restEndpointMethods: () => {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            const fn = () => {
                return {
                    data: {
                        id: 5,
                    },
                };
            };

            return {
                rest: {
                    checks: {
                        create: fn,
                        update: fn,
                    },
                },
            };
        },
        legacyRestEndpointMethods: () => {},
    };
});

describe("check", () => {
    beforeEach(() => {
        github.context.sha = "sha";

        vitest.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("startCheck", async () => {
        expect.assertions(2);

        const client = github.getOctokit("token");

        const createSpy = vitest.spyOn(client.rest.checks, "create");

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

        await expect(check.finishCheck("success", { summary: "Summary", text: "text", title: "title" })).resolves.toBe(undefined);
    });
});
