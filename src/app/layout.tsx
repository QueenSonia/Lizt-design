import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, IBM_Plex_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

import GoogleProvider from "./google-providers";
import { jsonLd, seoMetadata } from "@/lib/seo";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { MobileProvider } from "@/contexts/MobileContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = seoMetadata;

export const viewport: Viewport = {
  width: "device-width",
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1.0,
  initialScale: 1,
  themeColor: "#FF5000",
};

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${ibmPlexSans.variable} ${dmSans.variable} antialiased safe-area-padding`}
      >
        <ServiceWorkerRegister />
        <ErrorBoundary>
          <Providers>
            <AuthProvider>
              <NavigationProvider>
                <MobileProvider>
                  <Toaster />
                  <GoogleProvider>{children}</GoogleProvider>
                </MobileProvider>
              </NavigationProvider>
            </AuthProvider>
          </Providers>
        </ErrorBoundary>
        <div id="datepicker-portal" />
      </body>
    </html>
  );
}
