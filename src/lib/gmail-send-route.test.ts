import { describe, expect, it } from "vitest";
import handler from "../../api/google/messages/send";

describe("Gmail send route", () => {
  it("exports an API handler", () => {
    expect(typeof handler).toBe("function");
  });
});
