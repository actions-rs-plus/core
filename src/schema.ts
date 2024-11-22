export type CratesIO = CratesIOError | CratesIOFound;

export interface CratesIOFound {
    crate?: {
        newest_version?: string;
    };
}

export interface CratesIOError {
    errors: Array<{
        detail: string;
    }>;
}
