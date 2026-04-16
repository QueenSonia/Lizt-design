"use client";

import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export default function GoogleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  return <>{children}</>;
}
