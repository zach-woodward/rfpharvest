import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RFP Harvest — Government Contract Opportunities",
    template: "%s | RFP Harvest",
  },
  description:
    "Track and discover RFPs from municipal websites across the U.S. AI-powered summaries, real-time alerts, and comprehensive search for government contracting opportunities.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "RFP Harvest",
    title: "RFP Harvest — Government Contract Opportunities",
    description:
      "Track and discover municipal RFPs. AI summaries, alerts, and search for government contracting opportunities.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "RFP Harvest — Government Contract Opportunities",
    description:
      "Track and discover municipal RFPs. AI summaries, alerts, and search for government contracting opportunities.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JHL4MP15T6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JHL4MP15T6');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
