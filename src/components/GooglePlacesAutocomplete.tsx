"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapPin } from "lucide-react";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  label?: string;
  types?: string[];
  componentRestrictions?: { country?: string | string[] | null };
  className?: string;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search location",
  label,
  types = ["(regions)"],
  componentRestrictions,
  className = "",
}: GooglePlacesAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );

  // 🔑 Session token (key to cheaper billing)
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (window.google?.maps?.places) {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current =
          new google.maps.places.AutocompleteService();
      }

      if (!placesServiceRef.current) {
        const dummyDiv = document.createElement("div");
        placesServiceRef.current = new google.maps.places.PlacesService(
          dummyDiv
        );
      }
    }
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 🔁 Autocomplete with debounce + session token
  useEffect(() => {
    if (!query || !isFocused || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    // Create session token on first interaction
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        types,
        sessionToken: sessionTokenRef.current!,
      };

      if (componentRestrictions?.country) {
        request.componentRestrictions = {
          country: componentRestrictions.country,
        };
      }

      autocompleteServiceRef.current!.getPlacePredictions(
        request,
        (results) => {
          setPredictions(results || []);
        }
      );
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isFocused, types, componentRestrictions]);

  const handleInputChange = (newValue: string) => {
    setQuery(newValue);

    if (selectedPlace) {
      setSelectedPlace(null);
      onChange("");
    }
  };

  // ✅ Place Details (same session token)
  const handleSelect = (placeId: string) => {
    if (!placesServiceRef.current || !sessionTokenRef.current) return;

    setIsSelecting(true);

    placesServiceRef.current.getDetails(
      {
        placeId,
        sessionToken: sessionTokenRef.current,
        fields: ["name", "formatted_address", "address_components", "geometry"],
      },
      (place) => {
        if (place) {
          const selectedValue = place.name || place.formatted_address || "";
          setQuery(selectedValue);
          setSelectedPlace(place);
          setPredictions([]);
          setIsFocused(false);
          onChange(selectedValue, place);
        }

        // 🔄 End session (important)
        sessionTokenRef.current = null;
        setIsSelecting(false);
      }
    );
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!selectedPlace && !isSelecting) {
        setQuery("");
        onChange("");
        sessionTokenRef.current = null;
      }
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label
          htmlFor="google-places-autocomplete"
          className="text-sm text-slate-700"
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          id="google-places-autocomplete"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className={`h-11 pr-10 ${className}`}
        />

        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

        {isFocused && predictions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-b-0"
                onMouseDown={() => handleSelect(prediction.place_id)}
              >
                <div className="font-medium text-slate-900">
                  {prediction.structured_formatting?.main_text ||
                    prediction.description}
                </div>
                {prediction.structured_formatting?.secondary_text && (
                  <div className="text-xs text-slate-500 mt-1">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
