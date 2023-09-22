import * as io from "@actions/io";

import { RustUp } from "core";

jest.mock("@actions/io");

describe("rustup", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("get", async () => {
        const spy = jest.spyOn(io, "which").mockResolvedValue("/home/user/.cargo/bin/rustup");

        await expect(RustUp.get()).resolves.toEqual({ path: "/home/user/.cargo/bin/rustup" });

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
