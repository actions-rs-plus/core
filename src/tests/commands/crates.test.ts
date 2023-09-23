import * as http from "@actions/http-client";
import { type TypedResponse } from "@actions/http-client/lib/interfaces";

import { resolveVersion } from "commands/crates";

import { type CratesIO } from "schema";

jest.mock("@actions/http-client");

describe("resolveVersion", () => {
    it("resolves", async () => {
        const version = "1.0.107";

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue({
            statusCode: 200,
            headers: {},
            result: {
                crate: {
                    newest_version: version,
                },
            },
        });

        await expect(resolveVersion("serde_json")).resolves.toBe(version);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("not found", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 404,
            headers: {},
            result: {
                errors: [
                    {
                        detail: "Not Found",
                    },
                ],
            },
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Could not find package");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("fail 500", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 500,
            headers: {},
            result: null,
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Unable to fetch latest crate version");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("ok but still no crate version", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 200,
            headers: {},
            result: {
                crate: {},
            },
        };

        const spy = jest.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValue(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Unable to fetch latest crate version");

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
