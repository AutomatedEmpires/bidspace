// The homepage hero scene: a surveyed venue plan whose commercial positions
// reveal themselves and resolve into live marketplace state. Pure SVG + CSS
// keyframes — no animation library, honours prefers-reduced-motion globally.

const UNITS: {
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  state: "open" | "bidding" | "booked";
}[] = [
  { x: 70, y: 78, w: 52, h: 40, delay: 0.4, state: "booked" },
  { x: 130, y: 78, w: 52, h: 40, delay: 0.9, state: "bidding" },
  { x: 190, y: 78, w: 52, h: 40, delay: 1.4, state: "open" },
  { x: 250, y: 78, w: 52, h: 40, delay: 1.9, state: "open" },
  { x: 70, y: 196, w: 52, h: 40, delay: 1.1, state: "bidding" },
  { x: 130, y: 196, w: 52, h: 40, delay: 1.6, state: "open" },
  { x: 190, y: 196, w: 52, h: 40, delay: 2.1, state: "booked" },
  { x: 250, y: 196, w: 52, h: 40, delay: 2.4, state: "open" },
  { x: 336, y: 96, w: 44, h: 62, delay: 2.0, state: "bidding" },
  { x: 336, y: 172, w: 44, h: 62, delay: 2.6, state: "open" },
];

const STATE_STYLE: Record<string, { fill: string; stroke: string; label: string }> = {
  open: { fill: "rgba(36,80,126,0.10)", stroke: "#24507e", label: "Open" },
  bidding: { fill: "rgba(198,61,18,0.12)", stroke: "#c63d12", label: "Bids" },
  booked: { fill: "rgba(47,107,79,0.12)", stroke: "#2f6b4f", label: "Booked" },
};

export function HeroPlan() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 440 300"
        role="img"
        aria-label="A venue site plan where commercial positions become open, bidding, and booked marketplace inventory"
        className="w-full max-w-xl"
      >
        <style>{`
          @keyframes bs-reveal {
            0% { opacity: 0; transform: translateY(6px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes bs-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          .bs-unit { opacity: 0; animation: bs-reveal 0.7s ease-out forwards; }
          .bs-live { animation: bs-pulse 2.6s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .bs-unit { opacity: 1; animation: none; transform: none; }
            .bs-live { animation: none; opacity: 1; }
          }
        `}</style>

        {/* Parcel boundary */}
        <path
          d="M28 40 L412 24 L416 268 L24 284 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          opacity="0.85"
        />
        {/* Survey ticks */}
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <g key={t} opacity="0.3">
            <line x1={28 + (412 - 28) * t} y1={40 - 16 * t + 12} x2={28 + (412 - 28) * t} y2={40 - 16 * t + 4} stroke="currentColor" strokeWidth="1" />
            <line x1={24 + (416 - 24) * t} y1={284 - 16 * t + 2} x2={24 + (416 - 24) * t} y2={284 - 16 * t - 6} stroke="currentColor" strokeWidth="1" />
          </g>
        ))}
        {/* Main walkway */}
        <path d="M60 160 L392 148" stroke="currentColor" strokeWidth="14" opacity="0.06" strokeLinecap="round" />
        <path d="M60 160 L392 148" stroke="currentColor" strokeWidth="1" opacity="0.25" strokeDasharray="4 5" />
        {/* Entrance */}
        <g opacity="0.7">
          <path d="M24 150 L58 156" stroke="currentColor" strokeWidth="1.4" />
          <text x="10" y="142" fontSize="9" fill="currentColor" opacity="0.75" fontFamily="var(--font-instrument), sans-serif">
            ENTRANCE
          </text>
        </g>

        {/* Inventory units */}
        {UNITS.map((unit, i) => {
          const style = STATE_STYLE[unit.state]!;
          return (
            <g
              key={i}
              className="bs-unit"
              style={{ animationDelay: `${unit.delay}s` }}
            >
              <rect
                x={unit.x}
                y={unit.y}
                width={unit.w}
                height={unit.h}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="1.4"
              />
              <circle
                cx={unit.x + unit.w - 8}
                cy={unit.y + 8}
                r="3"
                fill={style.stroke}
                className={unit.state === "bidding" ? "bs-live" : undefined}
              />
              <text
                x={unit.x + 6}
                y={unit.y + unit.h - 7}
                fontSize="8.5"
                fontWeight="600"
                fill={style.stroke}
                fontFamily="var(--font-instrument), sans-serif"
              >
                {style.label}
              </text>
            </g>
          );
        })}

        {/* Callout: the claimed position */}
        <g className="bs-unit" style={{ animationDelay: "3s" }}>
          <line x1="156" y1="98" x2="216" y2="52" stroke="#c63d12" strokeWidth="1.2" />
          <rect x="216" y="34" width="128" height="34" rx="3" fill="#16181d" />
          <text x="226" y="48" fontSize="9.5" fontWeight="600" fill="#f6f4ee" fontFamily="var(--font-instrument), sans-serif">
            Booth B2 · 10×10 · Power
          </text>
          <text x="226" y="61" fontSize="9.5" fill="#ff7a47" fontFamily="var(--font-instrument), sans-serif">
            4 bids · from $650
          </text>
        </g>
      </svg>
    </div>
  );
}
