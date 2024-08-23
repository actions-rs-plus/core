import * as http from "@actions/http-client";

import type { CratesIO } from "@/schema";

export async function resolveVersion(crate: string): Promise<string> {
    const url = `https://crates.io/api/v1/crates/${crate}`;
    const client = new http.HttpClient("@actions-rs-plus (https://github.com/actions-rs-plus/)");

    const response = await client.getJson<CratesIO>(url);

    if (response.result === null) {
        throw new Error(`Unable to fetch latest crate version of "${crate}"`);
    }

    if ("errors" in response.result) {
        throw new Error(
            `Unable to fetch latest crate version of "${crate}", server returned ${JSON.stringify(response.result, null, 2)}`,
        );
    }

    if (response.result.crate?.newest_version === undefined) {
        throw new Error(`Unable to fetch latest crate version of "${crate}"`);
    }

    return response.result.crate.newest_version;
}
