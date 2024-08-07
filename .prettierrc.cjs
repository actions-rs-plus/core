// eslint-disable-next-line no-undef
module.exports = {
    arrowParens: "always",
    bracketSpacing: true,
    printWidth: 120,
    quoteProps: "as-needed",
    semi: true,
    singleQuote: false,
    useTabs: false,
    tabWidth: 4,
    trailingComma: "all",
    overrides: [
        {
            files: ["*.ts", "*.tsx"],
            options: {
                parser: "typescript",
            },
        },
        {
            files: ["*.cjs"],
        },
        {
            files: ["**/*.json"],
            options: {
                trailingComma: "none",
            },
        },
        {
            files: ["**/*.json"],
            options: {
                trailingComma: "none",
            },
        },
        {
            files: ["*.yaml", "*.yml"],
            options: {
                tabWidth: 2,
            },
        },
        {
            files: ["package.json", "package-lock.json"],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
