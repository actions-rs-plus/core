import envSchema from "env-schema";
import type { Static, TObject, TString } from "typebox";
import { Type } from "typebox";

const Config: TObject<{ HOME: TString }> = Type.Object({
    HOME: Type.String(),
});
type Config = Static<typeof Config>;

export const config: Config = envSchema<Config>({ schema: Config });
