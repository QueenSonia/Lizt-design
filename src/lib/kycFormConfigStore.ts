import type { KycFormSchema } from "@/types/kycFormBuilder";
import { cloneDefaultKycFormSchema } from "@/lib/kycFormDefaultTemplate";

const STORAGE_PREFIX = "lizt:kyc-form-config:";

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToKycFormStore(listener: Listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify() {
  _listeners.forEach((l) => l());
}

function _key(landlordId: string): string {
  return `${STORAGE_PREFIX}${landlordId}`;
}

export function isKycFormCustomized(landlordId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(_key(landlordId)) !== null;
}

export function getKycFormConfig(landlordId: string): KycFormSchema {
  if (typeof window === "undefined") return cloneDefaultKycFormSchema();
  const raw = window.localStorage.getItem(_key(landlordId));
  if (!raw) return cloneDefaultKycFormSchema();
  try {
    return JSON.parse(raw) as KycFormSchema;
  } catch {
    return cloneDefaultKycFormSchema();
  }
}

export function saveKycFormConfig(landlordId: string, schema: KycFormSchema) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(_key(landlordId), JSON.stringify(schema));
  _notify();
}

export function resetKycFormToDefault(landlordId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(_key(landlordId));
  _notify();
}
