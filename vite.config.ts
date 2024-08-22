import { type UserConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(() => {
    const config: UserConfig = {
        appType: "custom",
        plugins: [viteTsConfigPaths()],

        test: {
            environment: "node",
            environmentOptions: {},
            setupFiles: ["./test.setup.ts"],
            coverage: {
                exclude: [...coverageConfigDefaults.exclude, "./dependency-cruiser.config.mjs"],
                reportsDirectory: "coverage",
                reporter: ["json", "html", "text"],
            },
            outputFile: {
                junit: "./reports/test-report.xml",
            },
        },
    };

    return config;
});
