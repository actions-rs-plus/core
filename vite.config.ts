import { builtinModules } from "node:module";
import nodePath from "node:path";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import type { UserConfig } from "vite";
import { loadEnv } from "vite";
import { checker } from "vite-plugin-checker";
import dts from "vite-plugin-dts";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

import package_ from "./package.json";

export default defineConfig(({ mode }) => {
    const environment = loadEnv(mode, process.cwd(), "");

    const externals = new Set(builtinModules);
    const dependencies = new Set(Object.keys(package_.dependencies));

    const config: UserConfig = {
        appType: "custom",
        build: {
            lib: {
                entry: nodePath.resolve(import.meta.dirname, "src/core.ts"),
                fileName: (_format, entryName) => {
                    return `${entryName}.js`;
                },
                formats: ["es"],
            },
            target: "node20",
            minify: false,
            emptyOutDir: true,
            sourcemap: true,
            rollupOptions: {
                output: {
                    preserveModules: true,
                },
                external: (source: string): boolean => {
                    return externals.has(source) || source.startsWith("node:") || dependencies.has(source);
                },
            },
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
