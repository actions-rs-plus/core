import type { UserConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

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
