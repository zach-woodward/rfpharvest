import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "RFP Harvest — Government Contract Opportunities",
  description:
    "Track and discover RFPs from municipal websites across New Hampshire and beyond. AI-powered summaries, real-time alerts, and comprehensive search for government contracting opportunities.",
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
