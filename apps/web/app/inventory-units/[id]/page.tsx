import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatMoney,
  loadInventoryUnitDetail,
  type DiscoveryUnitDetail,
} from "../../../lib/discovery";

type PageParams = Promise<{ id: string }>;

function BidCard({ unit }: { unit: DiscoveryUnitDetail }) {
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(unit.href)}`;
  const minimum = formatMoney(unit.minimumBidCents);
  const buyNow = formatMoney(unit.buyNowPriceCents);

  return (
    <aside className="unit-detail__bid-card">
      <div className="unit-detail__price-block">
        <span className="unit-detail__price-label">Minimum bid</span>
        <span className="unit-detail__price-value">{minimum ?? "Open to offers"}</span>
      </div>
      {buyNow ? (
        <p className="unit-detail__buy-now">Buy now available at {buyNow}</p>
      ) : null}

      <div className="notice notice--sealed">
        <p className="notice__title">Sealed bidding</p>
        <p className="notice__body">
          Bids are sealed. You see only your own bid; the host reviews every bid privately
          and selects the winner. The highest bid does not automatically win.
        </p>
      </div>

      {unit.isBiddable ? (
        <Link href={signInHref} className="button button--primary button--block">
          Sign in to place a sealed bid
        </Link>
      ) : (
        <button type="button" className="button button--primary button--block" disabled>
          Not accepting bids right now
        </button>
      )}
      <p className="unit-detail__bid-status">Status: {unit.statusLabel}</p>
    </aside>
  );
}

export default async function InventoryUnitPage({ params }: { params: PageParams }) {
  const { id } = await params;
  const result = await loadInventoryUnitDetail(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status !== "ok" || !result.unit) {
    return (
      <main className="page-shell unit-detail">
        <Link href="/discover" className="unit-detail__back">
          ← Back to discovery
        </Link>
        <div className="notice" role="status">
          <p className="notice__title">This listing is not available right now</p>
          <p className="notice__body">
            {result.message ??
              "The inventory data source is not connected yet, so this unit cannot be shown."}
          </p>
        </div>
      </main>
    );
  }

  const unit = result.unit;

  return (
    <main className="page-shell unit-detail">
      <Link href="/discover" className="unit-detail__back">
        ← Back to discovery
      </Link>

      <div className="unit-detail__layout">
        <article className="unit-detail__main">
          <header className="unit-detail__header">
            <p className="unit-detail__eyebrow">
              {unit.unitTypeLabel}
              {unit.commerceLayerLabel ? `  ·  ${unit.commerceLayerLabel}` : ""}
            </p>
            <h1 className="unit-detail__title">{unit.name}</h1>
            {unit.opportunityTitle ? (
              <p className="unit-detail__opportunity">{unit.opportunityTitle}</p>
            ) : null}
            <ul className="unit-detail__facts">
              {unit.locationLabel ? (
                <li>
                  <span aria-hidden="true">📍</span> {unit.locationLabel}
                </li>
              ) : null}
              {unit.dateRangeLabel ? (
                <li>
                  <span aria-hidden="true">🗓️</span> {unit.dateRangeLabel}
                </li>
              ) : null}
              {unit.hostName ? (
                <li>
                  <span aria-hidden="true">🏢</span> {unit.hostName}
                </li>
              ) : null}
              {unit.estimatedAttendance != null ? (
                <li>
                  <span aria-hidden="true">👥</span> {unit.estimatedAttendance.toLocaleString("en-US")} expected
                </li>
              ) : null}
            </ul>
          </header>

          {unit.images.length > 0 ? (
            <div className="unit-detail__gallery">
              {unit.images.slice(0, 4).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="unit-detail__image" loading="lazy" />
              ))}
            </div>
          ) : null}

          {unit.opportunityDescription ? (
            <section className="unit-detail__section">
              <h2>About this opportunity</h2>
              <p>{unit.opportunityDescription}</p>
            </section>
          ) : null}

          {unit.audienceProfile ? (
            <section className="unit-detail__section">
              <h2>Audience</h2>
              <p>{unit.audienceProfile}</p>
            </section>
          ) : null}

          <section className="unit-detail__section">
            <h2>Unit details</h2>
            <dl className="unit-detail__specs">
              {unit.dimensions ? (
                <div>
                  <dt>Dimensions</dt>
                  <dd>{unit.dimensions}</dd>
                </div>
              ) : null}
              {unit.setupWindow ? (
                <div>
                  <dt>Setup window</dt>
                  <dd>{unit.setupWindow}</dd>
                </div>
              ) : null}
              {unit.teardownWindow ? (
                <div>
                  <dt>Teardown window</dt>
                  <dd>{unit.teardownWindow}</dd>
                </div>
              ) : null}
              {unit.venueType ? (
                <div>
                  <dt>Venue type</dt>
                  <dd>{unit.venueType}</dd>
                </div>
              ) : null}
            </dl>
            {unit.amenities.length > 0 ? (
              <ul className="unit-detail__amenities">
                {unit.amenities.map((amenity) => (
                  <li key={amenity} className="unit-detail__amenity">
                    <span aria-hidden="true">✓</span> {amenity}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {unit.requiredDocuments.length > 0 ? (
            <section className="unit-detail__section">
              <h2>Required documents</h2>
              <ul className="pill-list">
                {unit.requiredDocuments.map((doc) => (
                  <li key={doc} className="pill">
                    {doc}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {unit.categoryRestrictions.length > 0 ? (
            <section className="unit-detail__section">
              <h2>Category restrictions</h2>
              <ul className="pill-list">
                {unit.categoryRestrictions.map((restriction) => (
                  <li key={restriction} className="pill">
                    {restriction}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {unit.notes ? (
            <section className="unit-detail__section">
              <h2>Host notes</h2>
              <p>{unit.notes}</p>
            </section>
          ) : null}
        </article>

        <BidCard unit={unit} />
      </div>
    </main>
  );
}
