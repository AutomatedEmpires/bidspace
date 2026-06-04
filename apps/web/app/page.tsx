import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>BidSpace</h1>
      <p>Phase 3 auth scaffold is ready.</p>
      <p>
        <Link href="/sign-in">Sign in</Link> · <Link href="/sign-up">Sign up</Link> · <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
