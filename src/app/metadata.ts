import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://neynar-score-checkin.vercel.app"),
  title: "Neynar Score Check-in",
  description: "Check your Farcaster reputation score and daily check-in on Base",
  applicationName: "Neynar Score Check-in",
  authors: [{ name: "Gyoo", url: "https://github.com/gyoomei" }],
  generator: "Next.js",
  keywords: [
    "Farcaster",
    "Neynar",
    "Base",
    "Web3",
    "Reputation",
    "Score",
    "Check-in",
    "Mini App",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Gyoo",
  publisher: "Gyoo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://neynar-score-checkin.vercel.app",
    siteName: "Neynar Score Check-in",
    title: "Neynar Score Check-in",
    description: "Check your Farcaster reputation score and daily check-in on Base",
    images: [
      {
        url: "/app-hero-v2.png",
        width: 1200,
        height: 630,
        alt: "Neynar Score Check-in",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neynar Score Check-in",
    description: "Check your Farcaster reputation score and daily check-in on Base",
    images: ["/app-hero-v2.png"],
    creator: "@gyoomei",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Neynar Score",
  },
  formatDetection: {
    telephone: false,
  },
};
