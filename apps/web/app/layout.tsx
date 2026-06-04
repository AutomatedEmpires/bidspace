import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { getRequiredEnv } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidSpace",
  description: "BidSpace web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getRequiredEnv("CLERK_PUBLISHABLE_KEY");

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
