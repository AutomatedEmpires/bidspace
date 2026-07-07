import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getRequiredEnv } from "@/lib/env";
import { AnalyticsProvider } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bidspace.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BidSpace — The marketplace for temporary commercial space",
    template: "%s · BidSpace",
  },
  description:
    "BidSpace turns physical commercial access — vendor booths, market stalls, food-truck pads, kiosks, sponsor placements — into discoverable, biddable, bookable inventory.",
  openGraph: {
    siteName: "BidSpace",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getRequiredEnv("CLERK_PUBLISHABLE_KEY");

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className={`${fraunces.variable} ${instrumentSans.variable}`}>
        <body className="bg-canvas text-ink dark:bg-ink-deep dark:text-canvas">
          <Suspense fallback={null}>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
