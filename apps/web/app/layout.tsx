import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getRequiredEnv } from "@/lib/env";
import { MarketplacePhaseNotice } from "@/components/marketplace-phase-notice";
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
    "BidSpace connects hosts offering temporary vendor spaces with vendors who bid, apply, and build repeat relationships.",
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
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[3px] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas focus:outline-2 focus:outline-offset-2 focus:outline-signal dark:focus:bg-canvas dark:focus:text-ink"
          >
            Skip to content
          </a>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <MarketplacePhaseNotice />
              {children}
            </AnalyticsProvider>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
