import * as core from "@actions/core";
import * as http from "@actions/http-client";

import type { CratesIO } from "../schema";

export async function resolveVersion(crate: string): Promise<string> {
    const url = `https://crates.io/api/v1/crates/${crate}`;
    const client = new http.HttpClient("@actions-rs-plus (https://github.com/actions-rs-plus/)");

    const resp = await client.getJson<CratesIO>(url);

    if (resp.statusCode === 404) {
        throw new Error("Could not find package");
    }

    if (!resp.result) {
        throw new Error("Unable to fetch latest crate version");
    }

    if ("errors" in resp.result || !resp.result?.crate?.newest_version) {
        core.error("Unable to fetch latest crate version: ");
        core.error(JSON.stringify(resp.result, null, 2));

        throw new Error("Unable to fetch latest crate version");
    }

    return resp.result.crate.newest_version;
}
