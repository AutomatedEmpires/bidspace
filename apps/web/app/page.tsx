import Link from "next/link";

export default function Home() {
  return (
    <main className="marketing-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-mark">
          BidSpace
        </Link>
        <div className="nav-actions">
          <Link href="/discover">Discover inventory</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className="button button-dark">
            Start bidding
          </Link>
        </div>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Inventory-unit-first spatial commerce</p>
          <h1>Find temporary commercial space worth bidding for.</h1>
          <p className="hero-lede">
            BidSpace gives bidders a list-first, map-ready front door into vendor spaces,
            sponsor assets, service slots, ad placements, and short-term real estate.
          </p>
          <div className="hero-actions">
            <Link href="/discover" className="button button-primary">
              Browse live inventory
            </Link>
            <Link href="/sign-up" className="button button-ghost">
              Create bidder profile
            </Link>
          </div>
        </div>

        <aside className="hero-card" aria-label="Marketplace model">
          <div className="map-preview">
            <span className="map-pin pin-a" />
            <span className="map-pin pin-b" />
            <span className="map-pin pin-c" />
          </div>
          <div className="model-list">
            <p><strong>Inventory units</strong> are the primitive, not generic listings.</p>
            <p><strong>Sealed bids</strong> keep bidder strategy private.</p>
            <p><strong>Curated host selection</strong> means highest bid does not auto-win.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
