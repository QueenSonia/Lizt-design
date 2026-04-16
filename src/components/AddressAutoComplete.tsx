"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { MapPin } from "lucide-react";

type PlaceResult = google.maps.places.PlaceResult | null;

interface AddressAutocompleteProps {
  onPlaceSelected?: (place: PlaceResult) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  value?: string;
  label?: string;
  required?: boolean;
  id?: string;
  rows?: number;
  useTextarea?: boolean;
}

export default function AddressAutocomplete({
  onPlaceSelected,
  onChange,
  placeholder = "Search address or enter manually",
  disabled = false,
  className = "",
  error = "",
  value = "",
  label,
  required = false,
  id,
  rows = 3,
  useTextarea = false,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isFocused, setIsFocused] = useState(false); // Track input focus
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [isSelecting, setIsSelecting] = useState(false); // New state
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
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

  useEffect(() => {
    if (query && autocompleteServiceRef.current && isFocused) {
      autocompleteServiceRef.current.getPlacePredictions(
        { input: query, componentRestrictions: { country: "ng" } },
        (results) => {
          setPredictions(results || []);
        }
      );
    } else {
      setPredictions([]);
    }
  }, [query, isFocused]);

  const handleInputChange = (newValue: string) => {
    setQuery(newValue);
    if (selectedPlace) {
      setSelectedPlace(null); // Invalidate previous selection if user types again
      onChange?.(""); // Clear parent value
    }
  };

  const handleSelect = (placeId: string) => {
    setIsSelecting(true); // Set selecting flag
    if (!placesServiceRef.current) {
      setIsSelecting(false);
      return;
    }

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ["formatted_address", "geometry", "address_components", "name"],
      },
      (place) => {
        if (place) {
          const selectedAddress = place.formatted_address || place.name || "";
          setQuery(selectedAddress);
          setSelectedPlace(place);
          setPredictions([]); // Clear predictions to hide dropdown
          setIsFocused(false); // Optionally remove focus
          onChange?.(selectedAddress);
          onPlaceSelected?.(place); // Pass PlaceResult (includes geometry)
        }
        setIsSelecting(false); // Reset selecting flag
      }
    );
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!selectedPlace && !isSelecting) {
        // Check isSelecting flag
        setQuery("");
        onChange?.("");
      }
      setIsFocused(false);
    }, 200); // Delay to allow for click on prediction
  };

  const InputComponent = useTextarea ? Textarea : Input;

  return (
    <div className="space-y-2">
      {label && (
        <Label
          htmlFor={id || "address-autocomplete"}
          className="text-sm text-slate-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <InputComponent
          id={id || "address-autocomplete"}
          type={useTextarea ? undefined : "text"}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          rows={useTextarea ? rows : undefined}
          className={`${useTextarea ? "" : "h-11"} pr-10 ${className} ${
            error ? "border-red-500" : ""
          }`}
        />
        <MapPin
          className={`absolute right-3 ${
            useTextarea ? "top-3" : "top-1/2 -translate-y-1/2"
          } w-5 h-5 text-slate-400`}
        />
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
