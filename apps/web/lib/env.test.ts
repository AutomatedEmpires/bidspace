import assert from "node:assert/strict";
import { test } from "node:test";
import { getRequiredEnv } from "./env";

function withEnv<T>(overrides: Record<string, string | undefined>, callback: () => T): T {
  const previous: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("falls back to NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for local web runtime", () => {
  withEnv(
    {
      CLERK_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fallback",
      NEXT_PHASE: undefined,
    },
    () => {
      assert.equal(getRequiredEnv("CLERK_PUBLISHABLE_KEY"), "pk_test_fallback");
    },
  );
});

test("throws a developer-facing setup message outside the build phase", () => {
  withEnv(
    {
      CLERK_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined,
      NEXT_PHASE: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.throws(
        () => getRequiredEnv("CLERK_PUBLISHABLE_KEY"),
        /apps\/web\/.env\.local|doppler run -- pnpm --filter @bidspace\/web dev/,
      );
    },
  );
});