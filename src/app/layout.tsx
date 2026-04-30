import "@/app/globals.css";
import { metadata } from "@/app/metadata";
import { viewport } from "@/app/viewport";
import { ThemeClient } from "@/components/theme-client";
import { ProvidersAndInitialization } from "@/features/app/providers-and-initialization";
import { Caveat, Geist, Geist_Mono, Patrick_Hand } from "next/font/google";
import { ReactNode } from "react";

export { metadata, viewport };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeClient />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Neynar Score" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${patrickHand.variable} antialiased`}
      >
        <ProvidersAndInitialization>{children}</ProvidersAndInitialization>
      </body>
    </html>
  );
}
