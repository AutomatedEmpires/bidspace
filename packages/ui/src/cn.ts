import { clsx, type ClassValue } from "clsx";

// Single class-combining helper for all BidSpace UI. Later, if class conflicts
// become a real problem, swap the internals for tailwind-merge in one place.
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
