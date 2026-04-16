// Map country names to ISO 3166-1 alpha-2 codes for Google Places API
export const getCountryCode = (countryName?: string): string | undefined => {
  if (!countryName) return undefined;

  const countryMap: Record<string, string> = {
    // Africa
    Nigeria: "ng",
    Nigerian: "ng",
    Ghana: "gh",
    Ghanaian: "gh",
    Kenya: "ke",
    Kenyan: "ke",
    "South Africa": "za",
    "South African": "za",
    Egypt: "eg",
    Egyptian: "eg",
    Morocco: "ma",
    Moroccan: "ma",
    Ethiopia: "et",
    Ethiopian: "et",
    Tanzania: "tz",
    Tanzanian: "tz",
    Uganda: "ug",
    Ugandan: "ug",
    Rwanda: "rw",
    Rwandan: "rw",

    // North America
    "United States": "us",
    American: "us",
    USA: "us",
    Canada: "ca",
    Canadian: "ca",
    Mexico: "mx",
    Mexican: "mx",

    // Europe
    "United Kingdom": "gb",
    British: "gb",
    UK: "gb",
    France: "fr",
    French: "fr",
    Germany: "de",
    German: "de",
    Italy: "it",
    Italian: "it",
    Spain: "es",
    Spanish: "es",
    Netherlands: "nl",
    Dutch: "nl",
    Belgium: "be",
    Belgian: "be",
    Switzerland: "ch",
    Swiss: "ch",
    Portugal: "pt",
    Portuguese: "pt",
    Poland: "pl",
    Polish: "pl",

    // Asia
    China: "cn",
    Chinese: "cn",
    India: "in",
    Indian: "in",
    Japan: "jp",
    Japanese: "jp",
    "South Korea": "kr",
    Korean: "kr",
    Singapore: "sg",
    Singaporean: "sg",
    Malaysia: "my",
    Malaysian: "my",
    Thailand: "th",
    Thai: "th",
    Vietnam: "vn",
    Vietnamese: "vn",
    Philippines: "ph",
    Filipino: "ph",
    Philippine: "ph",
    Indonesia: "id",
    Indonesian: "id",
    Pakistan: "pk",
    Pakistani: "pk",
    Bangladesh: "bd",
    Bangladeshi: "bd",

    // Middle East
    "United Arab Emirates": "ae",
    UAE: "ae",
    Emirati: "ae",
    "Saudi Arabia": "sa",
    Saudi: "sa",
    Israel: "il",
    Israeli: "il",
    Turkey: "tr",
    Turkish: "tr",

    // Oceania
    Australia: "au",
    Australian: "au",
    "New Zealand": "nz",
    "New Zealander": "nz",

    // South America
    Brazil: "br",
    Brazilian: "br",
    Argentina: "ar",
    Argentinian: "ar",
    Chile: "cl",
    Chilean: "cl",
    Colombia: "co",
    Colombian: "co",
  };

  // Try exact match first
  if (countryMap[countryName]) {
    return countryMap[countryName];
  }

  // Try case-insensitive match
  const lowerCaseName = countryName.toLowerCase();
  for (const [key, value] of Object.entries(countryMap)) {
    if (key.toLowerCase() === lowerCaseName) {
      return value;
    }
  }

  return undefined;
};

// Extract country name from a place result
export const extractCountryFromPlace = (
  place: google.maps.places.PlaceResult
): string | undefined => {
  if (!place.address_components) return undefined;

  const countryComponent = place.address_components.find((component) =>
    component.types.includes("country")
  );

  return countryComponent?.long_name;
};
