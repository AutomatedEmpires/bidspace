export default function DiscoverLoading() {
  return (
    <main className="page-shell discover" aria-busy="true">
      <header className="hero">
        <div className="skeleton skeleton--eyebrow" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--subtitle" />
      </header>

      <div className="skeleton skeleton--panel" />

      <div className="discover__layout">
        <section className="discover__results">
          <div className="discovery-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton skeleton--card" />
            ))}
          </div>
        </section>
        <div className="skeleton skeleton--map" />
      </div>
    </main>
  );
}
