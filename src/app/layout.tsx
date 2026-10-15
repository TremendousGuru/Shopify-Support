import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaRegistration } from "@/components/shared/PwaRegistration";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";

export const metadata: Metadata = {
  title: "Shopify Support — Merchant Support & Commerce Services",
  description:
    "Official customer support and ecommerce service management platform for Shopify merchants and growing online stores.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/shopify-logo-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shopify Support",
  },
};

export const viewport: Viewport = {
  themeColor: "#008060",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f6f6f7] text-[#202223] antialiased" suppressHydrationWarning>
        <PwaRegistration />
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
