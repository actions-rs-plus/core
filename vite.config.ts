import nodePath from "node:path";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import type { UserConfig } from "vite";
import { loadEnv } from "vite";
import { checker } from "vite-plugin-checker";
import dts from "vite-plugin-dts";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
    const environment = loadEnv(mode, process.cwd(), "");

    const config: UserConfig = {
        appType: "custom",
        build: {
            lib: {
                entry: nodePath.resolve(import.meta.dirname, "src/core.ts"),
                formats: ["es"],
            },
            target: "node24",
            minify: false,
            emptyOutDir: true,
            sourcemap: true,
            ssr: true,
            rollupOptions: {
                output: {
                    preserveModules: true,
                },
            },
        },
        ssr: {
            target: "node",
        },
        resolve: {
            alias: {
                "@/": nodePath.resolve(import.meta.dirname, "src/"),
            },
        },
        plugins: [
            checker({ typescript: true }),
            viteTsConfigPaths(),
            dts({
                insertTypesEntry: true,
                entryRoot: "./src",
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
                reporter: ["json", "html", "text"],
                provider: "v8",
                reportsDirectory: "coverage",
            },
            environment: "node",
            environmentOptions: {
                // node: {},
            },
            globals: false,
            outputFile: {
                junit: "./reports/test-report.xml",
            },
            restoreMocks: true,
            setupFiles: ["./test.setup.ts"],
        },
    };

    return config;
});
