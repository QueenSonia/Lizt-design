import { BASE_URL } from "@/lib/constants";
import { Metadata } from "next";

const VERSION = Date.now();

export const seoMetadata: Metadata = {
  title: "Lizt - Smarter Rent & Tenancy Management",

  description:
    "Lizt is a free digital tenancy management service by Property Kraft that keeps tenancies simple, transparent, and stress-free for landlords and tenants. Manage rent, maintenance, and communication in one platform.",

  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Lizt",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        rel: "icon",
        type: "image/x-icon",
        sizes: "48x48",
      },
      {
        url: "/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/android-chrome-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        rel: "apple-touch-icon",
        sizes: "180x180",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
      },
    ],
  },

  keywords: [
    "Lizt",
    "Lizt app",
    "rent management",
    "tenancy management",
    "digital tenancy",
    "landlord software",
    "tenant portal",
    "property management software",
    "free rent management tool",
    "tenancy automation",
    "Property Kraft",
    "tenancy communication",
    "digital rent collection",
    "tenancy maintenance",
    "property rental tools",
    "Nigeria tenancy app",
    "Lagos tenancy software",
  ],

  authors: [{ name: "Property Kraft Team", url: BASE_URL }],
  category: "Rent & Tenancy Management",
  creator: "Lizt by Property Kraft",
  publisher: "Property Kraft",

  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Lizt",
    title: "Lizt - Smarter Rent & Tenancy Management",
    description:
      "Lizt is a free digital tenancy management service by Property Kraft. Keep tenancies simple, transparent, and stress-free for landlords and tenants.",
    images: [
      {
        url: `${BASE_URL}/og-image.png?v=${VERSION}`,
        width: 1200,
        height: 630,
        alt: "Lizt tenancy management platform",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Lizt - Smarter Rent & Tenancy Management",
    description:
      "Lizt is a free digital tenancy management service by Property Kraft. Simplify rent, maintenance, and communication.",
    creator: "@propertykraft",
    site: "@propertykraft",
    images: [`${BASE_URL}/opengraph-image.png?v=${VERSION}`],
  },

  alternates: {
    canonical: BASE_URL,
  },
};
