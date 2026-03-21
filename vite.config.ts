import nodePath from "node:path";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import type { UserConfig } from "vite";
import { loadEnv } from "vite";
import { checker } from "vite-plugin-checker";
import dts from "vite-plugin-dts";
import type { ViteUserConfigFn } from "vitest/config";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

const configFunction: ViteUserConfigFn = defineConfig(({ mode }) => {
    const environment = loadEnv(mode, process.cwd(), "");

    const config: UserConfig = {
        appType: "custom",
        build: {
            lib: {
                entry: nodePath.resolve(import.meta.dirname, "src/core.ts"),
                formats: ["es"],
            },
            minify: false,
            target: "node24",
            emptyOutDir: true,
            sourcemap: true,
            ssr: true,
            rolldownOptions: {
                output: {
                    preserveModules: true,
                },
            },
        },
        ssr: {
            target: "node",
        },
        resolve: {
            tsconfigPaths: true,
        },
        plugins: [
            checker({ typescript: true }),
            dts({
                insertTypesEntry: true,
                entryRoot: "./src",
                tsconfigPath: "./tsconfig.build.json",
                rollupTypes: true,
                exclude: ["test.setup.ts", "vite.config.ts", "src/tests/**"],
            }),
            codecovVitePlugin({
                enableBundleAnalysis: environment["GITHUB_ACTIONS"] === "true",
                bundleName: "core",
                oidc: {
                    useGitHubOIDC: true,
                },
                telemetry: false,
            }),
        ],
        test: {
            coverage: {
                exclude: [...coverageConfigDefaults.exclude, "./dependency-cruiser.config.mjs"],
                reporter: ["json", "html", "text", "lcov"],
                provider: "v8",
                reportsDirectory: "reports",
            },
            environment: "node",
            environmentOptions: {
                // node: {},
            },
            globals: false,
            outputFile: {
                junit: "./reports/results.xml",
            },
            restoreMocks: true,
            setupFiles: ["./test.setup.ts"],
            server: {
                deps: {
                    inline: ["@actions/cache", "@actions/core", "@actions/exec", "@actions/io", "@actions/tool-cache"],
                },
            },
        },
    };

    return config;
});

export default configFunction;
