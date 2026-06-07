import Link from "next/link";

const pillars = [
  {
    title: "Verification-aware",
    body: "Organizations, venues, and supply carry explicit trust state instead of implied credibility.",
  },
  {
    title: "Reputation that compounds",
    body: "Post-booking reviews feed a marketplace trust score that hosts and bidders can actually read.",
  },
  {
    title: "Operator oversight",
    body: "Admin surfaces expose verification workload, supply readiness, and the sealed-bid audit trail.",
  },
];

export default function Home() {
  return (
    <main className="platform-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Spatial commerce marketplace</p>
          <h1>BidSpace</h1>
          <p className="page-description">
            A map-first bidding marketplace for temporary commercial inventory — now with a real trust, reviews, and admin layer.
          </p>
          <p>
            <Link href="/sign-in">Sign in</Link> · <Link href="/sign-up">Sign up</Link> · <Link href="/dashboard">Dashboard</Link>
          </p>
        </div>
      </section>

      <section className="metric-grid">
        {pillars.map((pillar) => (
          <article className="metric-card" key={pillar.title}>
            <span>{pillar.title}</span>
            <p>{pillar.body}</p>
          </article>
        ))}
        <article className="metric-card">
          <span>Explore</span>
          <p>
            <Link href="/trust">Trust center</Link> · <Link href="/reviews">Reviews</Link> · <Link href="/admin">Admin</Link>
          </p>
        </article>
      </section>
    </main>
  );
}
