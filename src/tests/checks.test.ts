import { getOctokit } from "@actions/github";

import * as github from "@actions/github";

import { Check } from "checks";

// I hate doing thing like this, but it's the only way I could figure out on how
// to properly mock out the client.rest methods
jest.mock("@octokit/plugin-rest-endpoint-methods", () => {
    return {
        restEndpointMethods: () => {
            return {
                rest: {
                    checks: {
                        create: () => {
                            return {
                                data: {
                                    id: 5,
                                },
                            };
                        },
                        update: () => {
                            return {
                                data: {
                                    id: 5,
                                },
                            };
                        },
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

        jest.spyOn(github.context, "repo", "get").mockReturnValue({
            repo: "repo",
            owner: "owner",
        });
    });

    it("startCheck", async () => {
        expect.assertions(2);

        const client = getOctokit("token");

        const createSpy = jest.spyOn(client.rest.checks, "create");

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
        const client = getOctokit("token");

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.cancelCheck()).resolves.toBe(undefined);
    });

    it("finishCheck", async () => {
        const client = getOctokit("token");

        const check: Check = await Check.startCheck(client, "check-name", "in_progress");

        await expect(check.finishCheck("success", { summary: "Summary", text: "text", title: "title" })).resolves.toBe(undefined);
    });
});
