// import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
// import eslint from "eslint";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import-x";
import stylistic from "@stylistic/eslint-plugin-ts";
import love from "eslint-config-love";
import promise from "eslint-plugin-promise";
import nPlugin from "eslint-plugin-n";
// import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

function fixUpLoveRules() {
    let rules = love.rules;

    delete rules["@typescript-eslint/ban-types"];

    let patchedRules = {};

    for (let [key, value] of Object.entries(rules)) {
        if (key.startsWith("import/")) {
            patchedRules[key.replace("import/", "import-x/")] = value;
        }
    }

    return patchedRules;
}

export default tseslint.config(
    ...compat.extends("eslint:recommended"),
    {
        ignores: ["dist/**", "reports/**", "coverage/**"],
    },
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: "module", // Allows for the use of imports
                ecmaVersion: "latest",
                projectService: true,
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            "import-x/resolver": {
                node: {
                    extensions: [".d.ts", ".ts"],
                },
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "import-x": importPlugin,
            "@stylistic/ts": stylistic,
            promise: promise,
            n: nPlugin,
        },
        rules: {
            ...fixUpLoveRules(),
            ...importPlugin.configs.recommended.rules,
            ...importPlugin.configs.typescript.rules,
            "no-throw-literal": "off",
            "@stylistic/ts/no-extra-semi": "error",
            "@typescript-eslint/array-type": ["error", { default: "array" }],
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    fixStyle: "inline-type-imports",
                },
            ],
            "@typescript-eslint/no-extraneous-class": "error",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": ["error"],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "enumMember",
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],
                },
            ],
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: [
                        // Index signature
                        "signature",
                        // Fields
                        "private-field",
                        "public-field",
                        "protected-field",
                        // Constructors
                        "public-constructor",
                        "protected-constructor",
                        "private-constructor",
                        // Methods
                        "public-method",
                        "protected-method",
                        "private-method",
                    ],
                },
            ],
            "@typescript-eslint/no-array-constructor": "error",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-for-in-array": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/parameter-properties": "error",
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/no-this-alias": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/no-useless-constructor": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
            "@typescript-eslint/no-shadow": "error",
            "@typescript-eslint/only-throw-error": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-includes": "error",
            "@typescript-eslint/prefer-regexp-exec": "warn",
            "@typescript-eslint/prefer-string-starts-ends-with": "error",
            "@typescript-eslint/promise-function-async": "off",
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/restrict-plus-operands": "error",
            "@typescript-eslint/return-await": "off",
            "@typescript-eslint/sort-type-constituents": "error",
            "@typescript-eslint/strict-boolean-expressions": "off",
            "@typescript-eslint/triple-slash-reference": ["error", { types: "always" }],
            "@typescript-eslint/unbound-method": "error",
            "@typescript-eslint/unified-signatures": "error",
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "sort-imports": [
                "error",
                {
                    ignoreDeclarationSort: true,
                },
            ],
            "import-x/newline-after-import": "error",
            "import-x/no-duplicates": "error",
            "import-x/no-unresolved": "error",
            "import-x/no-relative-packages": "error",
            "import-x/consistent-type-specifier-style": ["error", "prefer-inline"],
            eqeqeq: ["error", "always"],
            "no-fallthrough": "error",
            "no-return-await": "error",
            "require-await": "error",
            "prefer-template": "error",
            curly: ["error", "all"],
            "arrow-body-style": ["error", "always"],
            quotes: [
                "error",
                "double",
                {
                    avoidEscape: true,
                    allowTemplateLiterals: false,
                },
            ],
            "eol-last": ["error", "always"],
            "object-shorthand": ["error", "always"],
            "no-useless-rename": [
                "error",
                {
                    ignoreDestructuring: false,
                    ignoreImport: false,
                    ignoreExport: false,
                },
            ],
            "no-restricted-imports": ["error", { patterns: [".*"] }],
            "class-methods-use-this": "off",
            // indent: ["error", 4],
            "max-len": "off",
            "no-dupe-class-members": "off",
            "no-extra-semi": "off",
            "no-new": "off",
            "no-param-reassign": "off",
            "no-underscore-dangle": "off",
            "no-useless-constructor": "off",
            "no-unused-expressions": "error",
            "no-restricted-syntax": ["error", "DebuggerStatement", "LabeledStatement", "WithStatement"],
            "no-use-before-define": "off",
            "no-shadow": "off",
            "import-x/prefer-default-export": "off",
            "import-x/no-cycle": "off",
            "import-x/no-extraneous-dependencies": "off",
            "import-x/extensions": [
                "error",
                "never",
                {
                    json: "always",
                },
            ],
            "import-x/order": [
                "error",
                {
                    "newlines-between": "always-and-inside-groups",
                    alphabetize: { order: "asc", caseInsensitive: true },
                },
            ],
        },
    },

    {
        files: ["**/*.mjs", "**/*.cjs"],
        extends: [tseslint.configs.disableTypeChecked],
    },
    prettier,
);
