export type MeasurementSystem = "metric" | "imperial";

const IMPERIAL_COUNTRIES = new Set([
  "united states", "usa", "us", "united states of america",
  "myanmar", "burma", "liberia",
]);

export function detectSystem(locationName: string): MeasurementSystem {
  const lower = locationName.toLowerCase();
  for (const country of IMPERIAL_COUNTRIES) {
    if (lower.includes(country)) return "imperial";
  }
  const usStates = /,\s*(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\s*$/i;
  if (usStates.test(lower)) return "imperial";
  return "metric";
}

export function getPreferredUnits(system: MeasurementSystem) {
  return {
    temperature: system === "imperial" ? "F" as const : "C" as const,
    distance: system === "imperial" ? "ft" as const : "m" as const,
    area: system === "imperial" ? "ft²" as const : "m²" as const,
    rainfall: system === "imperial" ? "in" : "mm",
  };
}
