// Build-only placeholders. These are NEVER used at runtime — only returned
// during `next build` (NEXT_PHASE === "phase-production-build"), when no real
// secrets are present (CI, Vercel preview, local builds). They let module-scope
// reads (Clerk middleware / ClerkProvider) compile and prerender without
// crashing. The Clerk publishable placeholder is a format-valid, public test
// key (decodes to clerk.example.com$); it is not a credential.
const BUILD_ONLY_PLACEHOLDERS: Record<string, string> = {
  CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k",
  CLERK_SECRET_KEY: "sk_test_build_only_placeholder",
};

function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Read a required environment variable.
 *
 * - At runtime (serving requests): throws if the variable is missing, so
 *   misconfiguration fails fast.
 * - During `next build`: returns a build-only placeholder instead of throwing,
 *   so the build stays green without real secrets. This branch only executes at
 *   build time and its values are never served.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  }

  if (isProductionBuildPhase()) {
    return BUILD_ONLY_PLACEHOLDERS[name] ?? `build-only-${name.toLowerCase()}`;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}
