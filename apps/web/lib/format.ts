// Shared date/deadline formatting for marketplace surfaces.

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const DATE_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE_YEAR.format(d);
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE_TIME.format(d);
}

// "Aug 12–14" / "Aug 30 – Sep 2" / "Dec 30, 2026 – Jan 2, 2027"
export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  if (s.getFullYear() !== e.getFullYear()) {
    return `${DATE_YEAR.format(s)} – ${DATE_YEAR.format(e)}`;
  }
  if (s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
    return DATE_YEAR.format(s);
  }
  if (s.getMonth() === e.getMonth()) {
    return `${DATE.format(s)}–${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${DATE.format(s)} – ${DATE_YEAR.format(e)}`;
}

// Human deadline pressure: "closes in 4 days", "closes today", "closed".
export function describeDeadline(deadline: string | null, now: Date = new Date()): string | null {
  if (!deadline) return null;
  const due = new Date(deadline);
  const ms = due.getTime() - now.getTime();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) {
    const hours = Math.max(1, Math.floor(ms / 3_600_000));
    return `Closes in ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (days === 1) return "Closes tomorrow";
  if (days <= 21) return `Closes in ${days} days`;
  return `Closes ${DATE.format(due)}`;
}
