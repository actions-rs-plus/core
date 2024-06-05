import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const dependencies = ["@octokit/plugin-rest-endpoint-methods"];

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        environmentOptions: {},
        setupFiles: ["./test.setup.ts"],
        coverage: {
            reportsDirectory: "coverage",
        },
        deps: {
            optimizer: {
                ssr: {
                    exclude: dependencies,
                },
                web: {
                    exclude: dependencies,
                },
            },
        },
        server: {
            deps: {
                inline: dependencies,
            },
        },
    },
});
