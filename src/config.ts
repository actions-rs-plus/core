import envSchema from "env-schema";
import type { Static, TObject, TString } from "typebox";
import { Type } from "typebox";

type Config = Static<TObject<{ HOME: TString }>>;

export function readConfig(): Config {
    const schema: TObject<{ HOME: TString }> = Type.Object({ HOME: Type.String() });

    return envSchema<Config>({ schema });
}
