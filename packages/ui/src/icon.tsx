import type { SVGProps } from "react";

export type IconName =
  | "calendar"
  | "location"
  | "units"
  | "host"
  | "bidder"
  | "event"
  | "booking"
  | "warning";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  title?: string;
}

// TODO(issue #31): founder to choose final Streamline icon set/style.
// Keep this component interface stable; swap internals once the style gate is approved.
const ICON_PATHS: Record<IconName, string> = {
  calendar: "M5 2v2M19 2v2M3 8h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  location: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  units: "M3 4h18v16H3zM9 4v16M15 4v16",
  host: "M4 20h16M6 20V9l6-5 6 5v11M9 20v-6h6v6",
  bidder: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 1 1 16 0",
  event: "M3 6h18M8 3v6M16 3v6M5 10h14v10H5z",
  booking: "M5 12l4 4L19 6",
  warning: "M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.2 16a2 2 0 0 0 1.73 3Z",
};

export function Icon({ name, size = 18, title, ...props }: IconProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
