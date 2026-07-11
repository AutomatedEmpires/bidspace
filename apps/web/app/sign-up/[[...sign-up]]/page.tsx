import { SignUp } from "@clerk/nextjs";

// New users go to /onboarding to create their organization and pick roles.
export default function SignUpPage() {
  return (
    <main className="plan-grid flex min-h-dvh items-center justify-center px-4 py-12">
      <SignUp forceRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </main>
  );
}
