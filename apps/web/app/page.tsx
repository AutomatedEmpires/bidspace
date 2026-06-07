import Link from "next/link";

export default function Home() {
  return (
    <main className="bs-home">
      <section className="bs-hero">
        <p className="bs-eyebrow">BidSpace</p>
        <h2>Map-first host ops for biddable commercial space.</h2>
        <p>
          Hosts turn venues, optional events, opportunity packages, and Inventory Units into marketplace supply.
          Bidders compete for access; hosts curate the winning fit.
        </p>
        <div className="bs-pills">
          <Link className="bs-button" href="/dashboard">Dashboard</Link>
          <Link className="bs-button-secondary" href="/sign-in">Sign in</Link>
          <Link className="bs-button-secondary" href="/sign-up">Sign up</Link>
        </div>
      </section>
    </main>
  );
}
