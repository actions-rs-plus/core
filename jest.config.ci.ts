import config from "./jest.config";

config.collectCoverage = true;
config.testLocationInResults = true;
config.reporters = [["github-actions", { silent: false }], "summary"];

export default config;
