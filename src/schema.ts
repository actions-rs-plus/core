export type CratesIO = CratesIOError | CratesIOFound;

export interface CratesIOFound {
    crate?: {
        // biome-ignore lint/style/useNamingConvention: contract states camelcase
        newest_version?: string;
    };
}

export interface CratesIOError {
    errors: {
        detail: string;
    }[];
}
