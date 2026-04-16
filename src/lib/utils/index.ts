import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a string is a valid image src for next/image.
 * Returns true if the value starts with "/", "http://", "https://", or "blob:".
 */
export function isValidImageSrc(src: string | undefined | null): src is string {
  if (!src) return false;
  return src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:");
}
