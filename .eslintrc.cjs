/** @type { import("eslint").Linter.Config } */

const esLintConfig = {
    root: true,
    parser: "@typescript-eslint/parser",
    settings: {
        "import/resolver": {
            node: {
                extensions: [".d.ts", ".ts"],
            },
            typescript: {
                alwaysTryTypes: true,
            },
        },
    },
    env: {
        node: true,
        browser: true,
        es2022: true,
    },
    plugins: ["@typescript-eslint", "import", "promise"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "love",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:prettier/recommended",
    ],
    parserOptions: {
        sourceType: "module", // Allows for the use of imports
        ecmaVersion: "latest",
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
            jsx: true,
        },
    },
    ignorePatterns: [],
    rules: {
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
        "@typescript-eslint/no-extra-semi": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-for-in-array": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/parameter-properties": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-this-alias": "error",
        "@typescript-eslint/no-throw-literal": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-useless-constructor": "error",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
        "@typescript-eslint/no-shadow": "error",
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
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "import/no-unresolved": "error",
        "import/no-relative-packages": "error",
        "import/consistent-type-specifier-style": ["error", "prefer-inline"],
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
        "import/prefer-default-export": "off",
        "import/no-cycle": "off",
        "import/no-extraneous-dependencies": "off",
        "import/extensions": [
            "error",
            "never",
            {
                json: "always",
            },
        ],
        "import/order": [
            "error",
            {
                "newlines-between": "always-and-inside-groups",
                alphabetize: { order: "asc", caseInsensitive: true },
            },
        ],
    },
};

module.exports = esLintConfig;
