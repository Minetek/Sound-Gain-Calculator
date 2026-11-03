import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { Check, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface InteractiveMapProps {
  lat: number;
  lon: number;
  onConfirm: (lat: number, lon: number) => void;
  onMarkerMove?: (lat: number, lon: number) => void;
  confirmed: boolean;
}

export default function InteractiveMap({ lat, lon, onConfirm, onMarkerMove, confirmed }: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onMarkerMoveRef = useRef(onMarkerMove);
  const [markerLat, setMarkerLat] = useState(lat);
  const [markerLon, setMarkerLon] = useState(lon);

  onMarkerMoveRef.current = onMarkerMove;

  const updateMarker = useCallback((newLat: number, newLon: number) => {
    setMarkerLat(newLat);
    setMarkerLon(newLon);
    onMarkerMoveRef.current?.(newLat, newLon);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [lat, lon], zoom: 12, scrollWheelZoom: true });
    L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia</a>',
    }).addTo(map);
    const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
    marker.on("dragend", () => { const pos = marker.getLatLng(); updateMarker(pos.lat, pos.lng); });
    map.on("click", (e: L.LeafletMouseEvent) => { marker.setLatLng(e.latlng); updateMarker(e.latlng.lat, e.latlng.lng); });
    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setView([lat, lon], 12, { animate: true });
    if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
    setMarkerLat(lat);
    setMarkerLon(lon);
  }, [lat, lon]);

  return (
    <div className="relative rounded-[12px] overflow-hidden" style={{ height: 220 }}>
      <div ref={containerRef} className="h-full w-full z-0" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-3 left-3 right-3 z-[1000] bg-card/90 backdrop-blur-md rounded-[10px] px-4 py-3 flex items-center justify-between gap-3"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Navigation className="w-4 h-4 text-primary shrink-0" />
          <div className="text-xs min-w-0">
            <div className="text-muted-foreground">Coordinates</div>
            <div className="text-foreground font-mono font-medium truncate">
              {markerLat.toFixed(5)}, {markerLon.toFixed(5)}
            </div>
          </div>
        </div>
        {!confirmed ? (
          <button
            onClick={() => onConfirm(markerLat, markerLon)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary shrink-0">
            <Check className="w-3.5 h-3.5" />
            Confirmed
          </div>
        )}
      </motion.div>
    </div>
  );
}
