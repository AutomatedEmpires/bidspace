import Link from "next/link";

import type { DiscoveryUnitCard } from "../../lib/discovery";

interface DiscoveryCardProps {
  card: DiscoveryUnitCard;
}

export function DiscoveryCard({ card }: DiscoveryCardProps) {
  const tags = [...card.categoryTags, ...card.outcomeTags].slice(0, 3);

  return (
    <Link href={card.href} className="discovery-card" aria-label={card.name}>
      <div className="discovery-card__media">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" className="discovery-card__image" loading="lazy" />
        ) : (
          <div className="discovery-card__placeholder" aria-hidden="true">
            <span>{card.unitTypeLabel}</span>
          </div>
        )}
        <span className="discovery-card__status" data-status={card.status}>
          {card.statusLabel}
        </span>
        {card.distanceLabel ? (
          <span className="discovery-card__distance">{card.distanceLabel}</span>
        ) : null}
      </div>

      <div className="discovery-card__body">
        <p className="discovery-card__eyebrow">
          <span>{card.unitTypeLabel}</span>
          {card.commerceLayerLabel ? (
            <span className="discovery-card__eyebrow-sep">{card.commerceLayerLabel}</span>
          ) : null}
        </p>
        <h3 className="discovery-card__title">{card.name}</h3>
        {card.opportunityTitle ? (
          <p className="discovery-card__opportunity">{card.opportunityTitle}</p>
        ) : null}

        <ul className="discovery-card__meta">
          {card.venueLabel ? (
            <li>
              <span aria-hidden="true">📍</span> {card.venueLabel}
            </li>
          ) : null}
          {card.dateRangeLabel ? (
            <li>
              <span aria-hidden="true">🗓️</span> {card.dateRangeLabel}
            </li>
          ) : null}
          {card.estimatedAttendance != null ? (
            <li>
              <span aria-hidden="true">👥</span> {card.estimatedAttendance.toLocaleString("en-US")} expected
            </li>
          ) : null}
        </ul>

        {tags.length > 0 ? (
          <ul className="pill-list">
            {tags.map((tag) => (
              <li key={tag} className="pill">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {card.amenities.length > 0 ? (
          <p className="discovery-card__amenities">{card.amenities.join(" · ")}</p>
        ) : null}
      </div>

      <div className="discovery-card__footer">
        <span className="discovery-card__price">{card.priceLabel}</span>
        <span className="discovery-card__cta">View &amp; bid →</span>
      </div>
    </Link>
  );
}
