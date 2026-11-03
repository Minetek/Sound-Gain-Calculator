import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

interface LocationInputProps {
  value: LocationData | null;
  onChange: (value: LocationData) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [query, setQuery] = useState(value?.name || "");

  useEffect(() => {
    if (value?.name && value.name !== query) {
      setQuery(value.name);
    }
  }, [value?.name]);

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        <input
          type="text"
          placeholder="Search by city, town or postcode..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          className="w-full bg-secondary/50 text-foreground text-sm pl-10 pr-10 py-3 rounded-[12px] border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-shadow duration-200"
        />
      </div>

      {open && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 mt-2 w-full bg-card rounded-[12px] overflow-hidden"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 16px 32px -8px rgba(0,0,0,0.15)" }}
        >
          {results.map((loc) => (
            <button
              key={loc.place_id}
              onClick={() => {
                setQuery(loc.display_name);
                onChange({ name: loc.display_name, lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) });
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/60 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{loc.display_name}</span>
            </button>
          ))}
        </motion.div>
      )}

      {value && (
        <div className="flex items-center gap-2 mt-3 text-sm text-primary">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{value.name}</span>
        </div>
      )}
    </div>
  );
}
