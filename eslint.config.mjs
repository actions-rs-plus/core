import { TSESLint } from "@typescript-eslint/utils";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import-x";
import stylistic from "@stylistic/eslint-plugin-ts";
import promise from "eslint-plugin-promise";
import nPlugin from "eslint-plugin-n";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { fixupConfigRules } from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

// this is a modified copy from eslint-config-love
// * removed @typescript-eslint/ban-types
// * changed import to import-x
const eslintConfigLoveRules = {
    "@typescript-eslint/adjacent-overload-signatures": ["error"],
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/await-thenable": ["error"],
    "@typescript-eslint/ban-ts-comment": [
        "error",
        {
            "ts-expect-error": "allow-with-description",
            "ts-ignore": true,
            "ts-nocheck": true,
            "ts-check": false,
            minimumDescriptionLength: 3,
        },
    ],
    "@typescript-eslint/ban-tslint-comment": ["error"],
    "@typescript-eslint/ban-types": [
        "error",
        {
            extendDefaults: false,
            types: {
                String: {
                    message: "Use string instead",
                    fixWith: "string",
                },
                Boolean: {
                    message: "Use boolean instead",
                    fixWith: "boolean",
                },
                Number: {
                    message: "Use number instead",
                    fixWith: "number",
                },
                Symbol: {
                    message: "Use symbol instead",
                    fixWith: "symbol",
                },
                BigInt: {
                    message: "Use bigint instead",
                    fixWith: "bigint",
                },
                Function: {
                    message: [
                        "The `Function` type accepts any function-like value.",
                        "It provides no type safety when calling the function, which can be a common source of bugs.",
                        "It also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.",
                        "If you are expecting the function to accept certain arguments, you should explicitly define the function shape.",
                    ].join("\n"),
                },
                // object typing
                Object: {
                    message: [
                        'The `Object` type actually means "any non-nullish value", so it is marginally better than `unknown`.',
                        '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
                        '- If you want a type meaning "any value", you probably want `unknown` instead.',
                    ].join("\n"),
                },
                "{}": {
                    message: [
                        '`{}` actually means "any non-nullish value".',
                        '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
                        '- If you want a type meaning "any value", you probably want `unknown` instead.',
                    ].join("\n"),
                },
            },
        },
    ],
    "@typescript-eslint/class-methods-use-this": [
        "error",
        {
            exceptMethods: [],
            enforceForClassFields: true,
            ignoreOverrideMethods: false,
            ignoreClassesThatImplementAnInterface: false,
        },
    ],
    "@typescript-eslint/class-literal-property-style": ["error", "fields"],
    "@typescript-eslint/consistent-generic-constructors": ["error", "constructor"],
    "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
    "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
            assertionStyle: "as",
            objectLiteralTypeAssertions: "never",
        },
    ],
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-exports": [
        "error",
        {
            fixMixedExportsWithInlineTypeSpecifier: true,
        },
    ],
    "@typescript-eslint/consistent-type-imports": [
        "error",
        {
            prefer: "type-imports",
            disallowTypeAnnotations: true,
            fixStyle: "inline-type-imports",
        },
    ],
    "@typescript-eslint/dot-notation": [
        "error",
        {
            allowIndexSignaturePropertyAccess: false,
            allowKeywords: true,
            allowPattern: "",
            allowPrivateClassPropertyAccess: false,
            allowProtectedClassPropertyAccess: false,
        },
    ],
    "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
            allowExpressions: true,
            allowHigherOrderFunctions: true,
            allowTypedFunctionExpressions: true,
            allowDirectConstAssertionInArrowFunctions: true,
        },
    ],
    "@typescript-eslint/init-declarations": ["error", "always"],
    "@typescript-eslint/max-params": ["error", { max: 4 }],
    "@typescript-eslint/method-signature-style": ["error"],
    "@typescript-eslint/naming-convention": [
        "error",
        {
            selector: "variableLike",
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
            format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
    ],
    "@typescript-eslint/no-array-constructor": ["error"],
    "@typescript-eslint/no-array-delete": ["error"],
    "@typescript-eslint/no-base-to-string": ["error"],
    "@typescript-eslint/no-confusing-non-null-assertion": ["error"],
    "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: false, ignoreVoidOperator: false },
    ],
    "@typescript-eslint/no-dupe-class-members": ["error"],
    "@typescript-eslint/no-duplicate-enum-values": ["error"],
    "@typescript-eslint/no-duplicate-type-constituents": ["error", { ignoreIntersections: false, ignoreUnions: false }],
    "@typescript-eslint/no-dynamic-delete": ["error"],
    "@typescript-eslint/no-empty-function": [
        "error",
        {
            allow: [],
        },
    ],
    "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: false, ignoreRestArgs: false }],
    "@typescript-eslint/no-extra-non-null-assertion": ["error"],
    "@typescript-eslint/no-extraneous-class": ["error", { allowWithDecorator: true }],
    "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends", allowObjectTypes: "never" },
    ],
    "@typescript-eslint/no-floating-promises": ["error"],
    "@typescript-eslint/no-for-in-array": ["error"],
    "@typescript-eslint/no-implied-eval": ["error"],
    "@typescript-eslint/no-import-type-side-effects": ["error"],
    "@typescript-eslint/no-inferrable-types": ["error", { ignoreParameters: false, ignoreProperties: false }],
    "@typescript-eslint/no-invalid-void-type": ["error"],
    "@typescript-eslint/no-loop-func": ["error"],
    "@typescript-eslint/no-loss-of-precision": ["error"],
    "@typescript-eslint/no-misused-new": ["error"],
    "@typescript-eslint/no-misused-promises": ["error"],
    "@typescript-eslint/no-namespace": ["error"],
    "@typescript-eslint/no-non-null-asserted-optional-chain": ["error"],
    "@typescript-eslint/no-non-null-assertion": ["error"],
    "@typescript-eslint/no-redeclare": ["error", { builtinGlobals: false }],
    "@typescript-eslint/no-this-alias": ["error", { allowDestructuring: true }],
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
    "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
    "@typescript-eslint/no-unnecessary-type-constraint": ["error"],
    "@typescript-eslint/no-unsafe-argument": ["error"],
    "@typescript-eslint/no-unused-expressions": [
        "error",
        {
            allowShortCircuit: true,
            allowTernary: true,
            allowTaggedTemplates: true,
            enforceForJSX: false,
        },
    ],
    "@typescript-eslint/no-unused-vars": [
        "error",
        {
            args: "none",
            caughtErrors: "none",
            ignoreRestSiblings: true,
            vars: "all",
        },
    ],
    "@typescript-eslint/no-use-before-define": [
        "error",
        {
            functions: false,
            classes: false,
            enums: false,
            variables: false,
            typedefs: false,
        },
    ],
    "@typescript-eslint/no-useless-constructor": ["error"],
    "@typescript-eslint/no-var-requires": ["error"],
    "@typescript-eslint/non-nullable-type-assertion-style": ["error"],
    "@typescript-eslint/only-throw-error": ["error", { allowThrowingAny: false, allowThrowingUnknown: false }],
    "@typescript-eslint/prefer-function-type": ["error"],
    "@typescript-eslint/prefer-includes": ["error"],
    "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignoreConditionalTests: false, ignoreMixedLogicalExpressions: false },
    ],
    "@typescript-eslint/prefer-optional-chain": ["error"],
    "@typescript-eslint/prefer-promise-reject-errors": ["error"],
    "@typescript-eslint/prefer-readonly": ["error"],
    "@typescript-eslint/prefer-reduce-type-parameter": ["error"],
    "@typescript-eslint/prefer-return-this-type": ["error"],
    "@typescript-eslint/promise-function-async": ["error"],
    "@typescript-eslint/require-array-sort-compare": ["error", { ignoreStringArrays: true }],
    "@typescript-eslint/restrict-plus-operands": ["error", { skipCompoundAssignments: false }],
    "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    "@typescript-eslint/return-await": ["error", "always"],
    "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
            allowString: false,
            allowNumber: false,
            allowNullableObject: false,
            allowNullableBoolean: false,
            allowNullableString: false,
            allowNullableNumber: false,
            allowAny: false,
        },
    ],
    "@typescript-eslint/triple-slash-reference": ["error", { lib: "never", path: "never", types: "never" }],
    "@typescript-eslint/unbound-method": ["error", { ignoreStatic: false }],

    "accessor-pairs": ["error", { setWithoutGet: true, getWithoutSet: false, enforceForClassMembers: true }],
    "array-callback-return": [
        "error",
        {
            allowImplicit: false,
            allowVoid: false,
            checkForEach: false,
        },
    ],
    "constructor-super": ["error"],
    curly: ["error", "multi-line"],
    "default-case-last": ["error"],
    eqeqeq: ["error", "always", { null: "ignore" }],
    "new-cap": ["error", { newIsCap: true, capIsNew: false, properties: true }],
    "no-async-promise-executor": ["error"],
    "no-caller": ["error"],
    "no-case-declarations": ["error"],
    "no-class-assign": ["error"],
    "no-compare-neg-zero": ["error"],
    "no-cond-assign": ["error"],
    "no-const-assign": ["error"],
    "no-constant-condition": ["error", { checkLoops: false }],
    "no-control-regex": ["error"],
    "no-debugger": ["error"],
    "no-delete-var": ["error"],
    "no-dupe-args": ["error"],
    "no-dupe-keys": ["error"],
    "no-duplicate-case": ["error"],
    "no-useless-backreference": ["error"],
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-empty-character-class": ["error"],
    "no-empty-pattern": ["error"],
    "no-eval": ["error"],
    "no-ex-assign": ["error"],
    "no-extend-native": ["error"],
    "no-extra-bind": ["error"],
    "no-extra-boolean-cast": ["error"],
    "no-fallthrough": ["error"],
    "no-func-assign": ["error"],
    "no-global-assign": ["error"],
    "no-import-assign": ["error"],
    "no-invalid-regexp": ["error"],
    "no-irregular-whitespace": ["error"],
    "no-iterator": ["error"],
    "no-labels": ["error", { allowLoop: false, allowSwitch: false }],
    "no-lone-blocks": ["error"],
    "no-misleading-character-class": ["error"],
    "no-prototype-builtins": ["error"],
    "no-useless-catch": ["error"],
    "no-multi-str": ["error"],
    "no-new": ["error"],
    "no-new-func": ["error"],
    "no-new-symbol": ["error"],
    "no-new-wrappers": ["error"],
    "no-obj-calls": ["error"],
    "no-object-constructor": ["error"],
    "no-octal": ["error"],
    "no-octal-escape": ["error"],
    "no-proto": ["error"],
    "no-regex-spaces": ["error"],
    "no-return-assign": ["error", "except-parens"],
    "no-self-assign": ["error", { props: true }],
    "no-self-compare": ["error"],
    "no-sequences": ["error"],
    "no-shadow-restricted-names": ["error"],
    "no-sparse-arrays": ["error"],
    "no-template-curly-in-string": ["error"],
    "no-this-before-super": ["error"],
    "no-throw-literal": ["off"],
    "no-undef-init": ["error"],
    "no-unexpected-multiline": ["error"],
    "no-unmodified-loop-condition": ["error"],
    "no-unneeded-ternary": ["error", { defaultAssignment: false }],
    "no-unreachable": ["error"],
    "no-unreachable-loop": ["error"],
    "no-unsafe-finally": ["error"],
    "no-unsafe-negation": ["error"],
    "no-useless-call": ["error"],
    "no-useless-computed-key": ["error"],
    "no-useless-escape": ["error"],
    "no-useless-rename": ["error"],
    "no-useless-return": ["error"],
    "no-var": ["error"],
    "no-void": ["error", { allowAsStatement: true }],
    "no-with": ["error"],
    "object-shorthand": ["warn", "properties"],
    "one-var": ["error", { initialized: "never" }],
    "prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: false }],
    "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
    "symbol-description": ["error"],
    "unicode-bom": ["error", "never"],
    "use-isnan": [
        "error",
        {
            enforceForSwitchCase: true,
            enforceForIndexOf: true,
        },
    ],
    "valid-typeof": ["error", { requireStringLiterals: true }],
    yoda: ["error", "never"],

    export: ["error"],
    first: ["error"],
    "no-absolute-path": ["error", { esmodule: true, commonjs: true, amd: false }],
    "no-duplicates": ["error"],
    "no-named-default": ["error"],
    "no-webpack-loader-syntax": ["error"],

    "n/handle-callback-err": ["error", "^(err|error)$"],
    "n/no-callback-literal": ["error"],
    "n/no-deprecated-api": ["error"],
    "n/no-exports-assign": ["error"],
    "n/no-new-require": ["error"],
    "n/no-path-concat": ["error"],
    "n/process-exit-as-throw": ["error"],

    "promise/param-names": ["error"],
};

const eslintRuleNames = [...new TSESLint.Linter().getRules().keys()];
const namesOfEslintRulesForWhichWeAreUsingTsEquivalents = eslintRuleNames.filter((name) =>
    Object.hasOwn(eslintConfigLoveRules, `@typescript-eslint/${name}`),
);

export default tseslint.config(
    ...fixupConfigRules(compat.extends("eslint:recommended")),
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
            ["unicorn"]: eslintPluginUnicorn,
            n: nPlugin,
        },
        rules: {
            ...Object.fromEntries(namesOfEslintRulesForWhichWeAreUsingTsEquivalents.map((name) => [name, ["off"]])),
            ...importPlugin.configs.recommended.rules,
            ...importPlugin.configs.typescript.rules,
            "no-useless-computed-key": "error",
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
        files: ["*.mjs", "**/*.cjs"],
        extends: [tseslint.configs.disableTypeChecked],
        rules: {},
    },
    prettier,
);
