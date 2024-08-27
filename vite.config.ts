import path from "node:path";

import type { UserConfig } from "vite";
import dts from "vite-plugin-dts";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(() => {
    const config: UserConfig = {
        appType: "custom",

        build: {
            sourcemap: true,
            ssr: true,
            lib: {
                entry: path.resolve(import.meta.dirname, "src/core.ts"),
                formats: ["es"],
            },
            rollupOptions: {
                output: {
                    esModule: true,
                    preserveModules: true,
                },
            },
        },
        plugins: [
            viteTsConfigPaths(),
            dts({
                entryRoot: "./src",
                exclude: ["test.setup.ts", "vite.config.ts"],
            }),
        ],

        test: {
            coverage: {
                exclude: [...coverageConfigDefaults.exclude, "./dependency-cruiser.config.mjs"],
                reporter: ["json", "html", "text"],
                reportsDirectory: "coverage",
            },
            environment: "node",
            environmentOptions: {},
            outputFile: {
                junit: "./reports/test-report.xml",
            },
            setupFiles: ["./test.setup.ts"],
        },
    };

    return config;
});
