import path from "node:path";

import { rolldown } from "rolldown";
import { describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 1000 });

/**
 * Bundles a bare import of `entry` with all dependencies external and treated as pure. The output is this package's
 * top-level code.
 *
 * @param {string} entry Absolute path of the module to bundle.
 * @returns {Promise<Record<string, null | string>>} Code left after tree-shaking, per module, keyed by path relative to
 *   this file. Only modules with code left are listed.
 */
async function renderedModules(entry: string): Promise<Record<string, null | string>> {
    const bundle = await rolldown({
        input: "\0probe",
        plugins: [
            {
                name: "probe",
                resolveId: (id: string): string | undefined => {
                    return id === "\0probe" ? id : undefined;
                },
                load: (id: string): string | undefined => {
                    return id === "\0probe" ? `import ${JSON.stringify(entry)};` : undefined;
                },
            },
        ],
        external: (id: string): boolean => {
            return !id.startsWith(".") && !id.startsWith("\0") && !path.isAbsolute(id);
        },
        treeshake: { moduleSideEffects: "no-external" },
        platform: "node",
        logLevel: "silent",
    });

    const { output } = await bundle.generate({ format: "es" });
    await bundle.close();

    const [chunk] = output;

    return Object.fromEntries(
        Object.entries(chunk.modules)
            .filter(([, module]) => {
                return module.renderedLength > 0;
            })
            .map(([id, module]) => {
                return [path.relative(import.meta.dirname, id), module.code];
            }),
    );
}

describe("top-level side effects", () => {
    it("are detected", async () => {
        expect.hasAssertions();

        const { dirname, filename } = import.meta;
        const rendered = await renderedModules(filename);
        const key = path.relative(dirname, filename);

        expect(Object.keys(rendered)).toEqual([key]);
        expect(rendered[key]).toContain("describe(");
    });

    it("are absent from src/core.ts", async () => {
        expect.hasAssertions();

        await expect(renderedModules(path.resolve(import.meta.dirname, "../core.ts"))).resolves.toEqual({});
    });
});
