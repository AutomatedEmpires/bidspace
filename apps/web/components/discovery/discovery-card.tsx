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
          {card.unitTypeLabel}
          {card.commerceLayerLabel ? <span> \u00b7 {card.commerceLayerLabel}</span> : null}
        </p>
        <h3 className="discovery-card__title">{card.name}</h3>
        {card.opportunityTitle ? (
          <p className="discovery-card__opportunity">{card.opportunityTitle}</p>
        ) : null}

        <ul className="discovery-card__meta">
          {card.venueLabel ? <li>\ud83d\udccd {card.venueLabel}</li> : null}
          {card.dateRangeLabel ? <li>\ud83d\uddd3 {card.dateRangeLabel}</li> : null}
          {card.estimatedAttendance != null ? (
            <li>\ud83d\udc65 {card.estimatedAttendance.toLocaleString("en-US")} expected</li>
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
          <p className="discovery-card__amenities">{card.amenities.join(" \u00b7 ")}</p>
        ) : null}
      </div>

      <div className="discovery-card__footer">
        <span className="discovery-card__price">{card.priceLabel}</span>
        <span className="discovery-card__cta">View &amp; bid \u2192</span>
      </div>
    </Link>
  );
}
