import { test } from "node:test";
import assert from "node:assert/strict";
import { shiftInstant } from "./opportunities";

test("shiftInstant moves an instant by the window delta", () => {
  const shifted = shiftInstant(
    "2026-08-05T21:00:00.000Z", // unit availability start
    "2026-08-05T23:00:00.000Z", // source window start
    "2026-09-02T23:00:00.000Z", // new window start (4 weeks later)
  );
  assert.equal(shifted, "2026-09-02T21:00:00.000Z");
});

test("shiftInstant is identity when the window does not move", () => {
  const instant = "2026-08-05T21:00:00.000Z";
  assert.equal(shiftInstant(instant, "2026-08-05T23:00:00.000Z", "2026-08-05T23:00:00.000Z"), instant);
});

test("shiftInstant handles backwards moves", () => {
  const shifted = shiftInstant(
    "2026-08-05T21:00:00.000Z",
    "2026-08-05T23:00:00.000Z",
    "2026-07-29T23:00:00.000Z",
  );
  assert.equal(shifted, "2026-07-29T21:00:00.000Z");
});
