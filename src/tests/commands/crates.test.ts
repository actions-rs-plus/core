import * as http from "@actions/http-client";
import { type TypedResponse } from "@actions/http-client/lib/interfaces";
import { describe, expect, it, vi } from "vitest";

import { resolveVersion } from "@/commands/crates";
import { type CratesIO } from "@/schema";

describe("resolveVersion", () => {
    it("resolves", async () => {
        const version = "1.0.107";

        const spy = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce({
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

        const spy = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError(
            'Unable to fetch latest crate version of "serde_json", server returned {\n  "errors": [\n    {\n      "detail": "Not Found"\n    }\n  ]\n}',
        );

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("fail 500", async () => {
        const response: TypedResponse<CratesIO> = {
            statusCode: 500,
            headers: {},
            result: null,
        };

        const spy = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce(response);

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

        const spy = vi.spyOn(http.HttpClient.prototype, "getJson").mockResolvedValueOnce(response);

        await expect(resolveVersion("serde_json")).rejects.toThrowError("Unable to fetch latest crate version");

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
