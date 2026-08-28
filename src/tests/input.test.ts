import { describe, expect, it, test, vi } from "vitest";

import { getInput, getInputAsArray, getInputBool, getInputList } from "../input";

vi.setConfig({ testTimeout: 1000 });

describe("input", () => {
    describe("getInput", () => {
        it('env.INPUT_FOO | getInput("foo")', () => {
            vi.stubEnv("INPUT_FOO", "12345");
            expect(getInput("foo")).toBe("12345");
        });

        it('env.INPUT_FOO-BAR | getInput("foo-bar")', () => {
            vi.stubEnv("INPUT_FOO-BAR", "12345");
            expect(getInput("foo-bar")).toBe("12345");
        });

        it('env.INPUT_FOO_BAR | getInput("foo-bar")', () => {
            vi.stubEnv("INPUT_FOO_BAR", "12345");
            expect(getInput("foo-bar")).toBe("12345");
        });
    });

    describe("getInputBool", () => {
        it('"true" == true', () => {
            vi.stubEnv("INPUT_VALUE", "true");
            expect(getInputBool("value")).toBe(true);
        });

        it('"1" == true', () => {
            vi.stubEnv("INPUT_VALUE", "1");
            expect(getInputBool("value")).toBe(true);
        });

        it('"True" == true', () => {
            vi.stubEnv("INPUT_VALUE", "True");
            expect(getInputBool("value")).toBe(true);
        });

        it('"TRUE" == true', () => {
            vi.stubEnv("INPUT_VALUE", "TRUE");
            expect(getInputBool("value")).toBe(true);
        });

        it('"" == false', () => {
            vi.stubEnv("INPUT_VALUE", "");
            expect(getInputBool("value")).toBe(false);
        });

        it('"foobar" == false', () => {
            vi.stubEnv("INPUT_VALUE", "foobar");
            expect(getInputBool("value")).toBe(false);
        });
    });

    describe("getInputList", () => {
        test.each([
            ["", []],
            [", ,, ", []],
            ["one,two,three", ["one", "two", "three"]],
            [",one , two , three", ["one", "two", "three"]],
        ])('getInputList("%s") == %s', (input, expected) => {
            vi.stubEnv("INPUT_VALUE", input);
            expect(getInputList("value")).toStrictEqual(expected);
        });
    });

    describe("getInputAsArray", () => {
        test.each([
            ["", []],
            ["\n \n\n ", []],
            ["one\ntwo\nthree", ["one", "two", "three"]],
            ["\none \n two \n three", ["one", "two", "three"]],
        ])('getInputAsArray("%s") == %s', (input, expected) => {
            vi.stubEnv("INPUT_VALUE", input);
            expect(getInputAsArray("value")).toStrictEqual(expected);
        });
    });
});
