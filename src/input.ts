import type { InputOptions } from "@actions/core";
import { getInput as coreGetInput } from "@actions/core";

/**
 * Workaround for a GitHub weird input naming.
 *
 * For input `all-features: true` it will generate the `INPUT_ALL-FEATURES: true` env variable, which looks too weird.
 * Here we are trying to get proper name `INPUT_NO_DEFAULT_FEATURES` first, and if it does not exist, trying the
 * `INPUT_NO-DEFAULT-FEATURES`.
 *
 * @param {string} name Input name, e.g. `ALL-FEATURES`.
 * @param {string} options Status of the check, optional.
 * @returns {string} Value from the input set, or `""` (empty string) if unset.
 */
export function getInput(name: string, options?: InputOptions): string {
    const inputFullName = name.replaceAll("-", "_");
    const value = coreGetInput(inputFullName, options);
    if (value.length > 0) {
        return value;
    }

    return coreGetInput(name, options);
}

export function getInputBool(name: string, options?: InputOptions): boolean {
    const value = getInput(name, options);
    const normalized = value.trim().toLowerCase();

    return normalized === "true" || normalized === "1";
}

export function getInputList(name: string, options?: InputOptions): string[] {
    const raw = getInput(name, options);

    return raw
        .split(",")
        .map((item: string) => {
            return item.trim();
        })
        .filter((item: string) => {
            return item.length > 0;
        });
}

export function getInputAsArray(name: string, options?: InputOptions): string[] {
    return getInput(name, options)
        .split("\n")
        .map((line) => {
            return line.trim();
        })
        .filter((x) => {
            return x !== "";
        });
}
