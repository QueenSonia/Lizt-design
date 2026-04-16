import { WithContext, WebApplication } from "schema-dts";
import { BASE_URL } from "@/lib/constants";

export const jsonLd: WithContext<WebApplication> = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Lizt",
  url: BASE_URL,
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Property Management / Tenancy Management",
  description:
    "Lizt is a free digital tenancy management web application by Property Kraft Africa. It helps landlords and tenants manage rent, maintenance, and communication in a simple, transparent, and stress-free way.",
  image: `${BASE_URL}/opengraph-image.jpg`,
  screenshot: `${BASE_URL}/opengraph-image.png`,
  creator: {
    "@type": "Organization",
    name: "Property Kraft Africa",
    url: "https://www.propertykraft.africa",
    logo: "https://www.propertykraft.africa/logo-icon.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "17, Ayinde Akinmade Street, Lekki Phase 1",
      addressLocality: "Lekki",
      addressRegion: "Lagos State",
      postalCode: "100001",
      addressCountry: "NG",
    },
    telephone: "+234 816 549 0072",
    email: "propertykraftng@gmail.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+234 816 549 0072",
        contactType: "customer service",
        email: "propertykraftng@gmail.com",
        availableLanguage: "English",
      },
    ],
    sameAs: [
      "https://twitter.com/propertykraft",
      "https://www.linkedin.com/company/property-kraft",
    ],
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    category: "Free",
  },
  keywords: [
    "Lizt",
    "rent management",
    "tenancy management",
    "landlord software",
    "tenant portal",
    "property management software",
    "Property Kraft",
    "digital tenancy app",
    "rent collection tool",
    "Nigeria tenancy management",
  ],
};
