import * as http from "@actions/http-client";

import type { CratesIO } from "../schema";

export async function resolveVersion(crate: string): Promise<string> {
    const url = `https://crates.io/api/v1/crates/${crate}`;
    const client = new http.HttpClient("@actions-rs-plus (https://github.com/actions-rs-plus/)");

    const resp = await client.getJson<CratesIO>(url);

    if (!resp.result) {
        throw new Error(`Unable to fetch latest crate version of "${crate}"`);
    }

    if ("errors" in resp.result) {
        throw new Error(
            `Unable to fetch latest crate version of "${crate}", server returned ${JSON.stringify(resp.result, null, 2)}`,
        );
    }

    if (!resp.result?.crate?.newest_version) {
        throw new Error(`Unable to fetch latest crate version of "${crate}"`);
    }

    return resp.result.crate.newest_version;
}
