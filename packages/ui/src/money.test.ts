import assert from "node:assert/strict";
import test from "node:test";

import { formatMoneyCents } from "./money.js";

test("formatMoneyCents renders integer cents", () => {
  assert.equal(formatMoneyCents(12345), "$123.45");
});

test("formatMoneyCents rejects non-integer values", () => {
  assert.throws(() => formatMoneyCents(12.34), /integer cents/);
});
