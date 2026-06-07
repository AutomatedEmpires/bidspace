import Link from "next/link";

export const metadata = {
  title: "BidSpace — the marketplace for event inventory",
  description:
    "Discover vendor spaces, sponsor assets, service slots, and activations from curated hosts, then place a sealed bid.",
};

export default function Home() {
  return (
    <main className="page-shell home">
      <section className="home__hero">
        <p className="hero__eyebrow">Inventory-first event marketplace</p>
        <h1 className="hero__title">Find the right space, asset, or slot, then bid.</h1>
        <p className="hero__subtitle">
          BidSpace connects bidders with curated hosts across vendor spaces, sponsor assets,
          service slots, advertising placements, and temporary real estate. Browse live
          inventory, compare opportunities, and place a sealed bid.
        </p>
        <div className="home__cta-row">
          <Link href="/discover" className="button button--primary">
            Browse the marketplace
          </Link>
          <Link href="/sign-in" className="button">
            Sign in
          </Link>
        </div>
        <p className="home__meta">
          New here? <Link href="/sign-up">Create an account</Link> to start bidding.
        </p>
      </section>

      <section className="home__highlights">
        <article className="home__highlight">
          <h2>Inventory-unit first</h2>
          <p>Every listing is a concrete unit you can bid on, not a vague package.</p>
        </article>
        <article className="home__highlight">
          <h2>Curated host selection</h2>
          <p>
            Hosts review every bid privately and choose the best fit. The highest bid does not
            automatically win.
          </p>
        </article>
        <article className="home__highlight">
          <h2>Sealed bids</h2>
          <p>You see only your own bid. Bidding stays private and fair until a host decides.</p>
        </article>
      </section>
    </main>
  );
}
