import { formatMoney as coreFormatMoney } from "@bidspace/core";

export function formatMoneyCents(cents: number, currency = "USD", locale = "en-US"): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError("Money amounts must be integer cents.");
  }

  return coreFormatMoney(cents, currency, locale);
}
