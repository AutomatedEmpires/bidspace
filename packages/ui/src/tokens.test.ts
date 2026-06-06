import assert from "node:assert/strict";
import test from "node:test";

import { tokenCssVariables, tokens } from "./tokens.js";

test("tokenCssVariables exposes expected css custom properties", () => {
  assert.match(tokenCssVariables, /--bs-color-background/);
  assert.match(tokenCssVariables, /--bs-font-size-md/);
  assert.match(tokenCssVariables, /--bs-space-md/);
});

test("typed tokens are available", () => {
  assert.equal(tokens.colors.textPrimary, "#101828");
  assert.equal(tokens.radius.lg, "0.75rem");
});
