import { SignIn } from "@clerk/nextjs";

// Returning users land on /dashboard, which dispatches to their cockpit (and
// itself sends anyone who hasn't finished onboarding to /onboarding).
export default function SignInPage() {
  return (
    <main className="plan-grid flex min-h-dvh items-center justify-center px-4 py-12">
      <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
