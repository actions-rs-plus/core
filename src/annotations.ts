/**
 * Temporary implementation for GitHub Annotations missing feature.
 *
 * There is a working, but undocumented implementation,
 * which is abused by this module.
 *
 * Whole implementation could break unexpectedly if/when
 * this issue https://github.com/actions/toolkit/issues/186 will be implemented.
 *
 * Until then, this is our best option.
 */

/**
 * This `Annotation` interface matches the GitHub Annotations API annotation object
 * https://developer.github.com/v3/checks/runs/#annotations-object
 *
 * At this point most of the fields are silently ignored,
 * but callers should fill as much of them as possible,
 * since switch to the sane GitHub implementation will use them later.
 */

import * as os from "os";

export type AnnotationLevel = "failure" | "notice" | "warning";
type CommandProperties = Record<string, unknown>;

export interface Annotation {
    path: string;
    start_line: number;
    end_line: number;
    start_column?: number;
    end_column?: number;
    annotation_level: AnnotationLevel;
    message: string;
    title?: string;
    raw_details?: string;
}

function toCommandValue(input: unknown): string {
    if (!input) {
        return "";
    } else if (typeof input === "string" || input instanceof String) {
        return input as string;
    }
    return JSON.stringify(input);
}

export function escapeData(s: unknown): string {
    return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

export function escapeProperty(s: unknown): string {
    return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}

const CMD_STRING = "::";

function render(level: "error" | "warning", message: string, properties?: CommandProperties): string {
    let cmdStr = CMD_STRING + level;

    if (properties && Object.keys(properties).length > 0) {
        cmdStr += " ";
        let first = true;
        for (const [key, value] of Object.entries(properties)) {
            if (value) {
                if (first) {
                    first = false;
                } else {
                    cmdStr += ",";
                }

                cmdStr += `${key}=${escapeProperty(value)}`;
            }
        }
    }

    cmdStr += `${CMD_STRING}${escapeData(message)}`;
    return cmdStr;
}

export function annotate(annotation: Annotation): void {
    let level: "error" | "warning";
    switch (annotation.annotation_level) {
        case "notice":
        case "warning":
            level = "warning";
            break;
        case "failure":
            level = "error";
            break;
    }

    const text = render(level, annotation.message, {
        file: annotation.path,
        line: annotation.start_line,
        col: annotation.start_column,
    });

    process.stdout.write(text + os.EOL);
}
