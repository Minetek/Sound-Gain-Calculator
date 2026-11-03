import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Thermometer, Droplets, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import InteractiveMap from "./InteractiveMap";
import type { MeasurementSystem } from "@/lib/measurement";
import { getPreferredUnits } from "@/lib/measurement";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface ClimateData { temp: number[]; humidity: number[]; }

function estimateFallback(lat: number): ClimateData {
  const absLat = Math.abs(lat);
  const isSouthern = lat < 0;
  const baseTemp = 28 - absLat * 0.6;
  const seasonalAmp = Math.min(absLat * 0.3, 15);
  const baseHumidity = absLat < 15 ? 80 : absLat < 35 ? 55 : absLat < 55 ? 65 : 70;

  const temp: number[] = [];
  const humidity: number[] = [];
  for (let m = 0; m < 12; m++) {
    const phase = isSouthern ? Math.cos((m / 12) * 2 * Math.PI) : Math.cos(((m - 6) / 12) * 2 * Math.PI);
    temp.push(Math.round(baseTemp + seasonalAmp * phase));
    humidity.push(Math.round(baseHumidity + 15 * Math.sin(((m - 3) / 12) * 2 * Math.PI)));
  }
  return { temp, humidity };
}

async function fetchClimateData(lat: number, lon: number): Promise<ClimateData> {
  const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&models=EC_Earth3P_HR&daily=temperature_2m_mean&start_date=2010-01-01&end_date=2020-12-31`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Climate API error");
  const data = await res.json();
  const days = data.daily?.time as string[] | undefined;
  const temps = data.daily?.temperature_2m_mean as number[] | undefined;
  if (!days || !temps) throw new Error("No data");

  const tempSums = new Array(12).fill(0);
  const tempCounts = new Array(12).fill(0);
  for (let i = 0; i < days.length; i++) {
    const monthIdx = new Date(days[i]).getMonth();
    if (temps[i] != null) { tempSums[monthIdx] += temps[i]; tempCounts[monthIdx]++; }
  }
  const avgTemp = tempSums.map((s, i) => tempCounts[i] ? Math.round(s / tempCounts[i]) : 20);
  // Estimate humidity from latitude (API doesn't provide it easily)
  const fallback = estimateFallback(lat);
  return { temp: avgTemp, humidity: fallback.humidity };
}

const toF = (c: number) => Math.round(c * 9 / 5 + 32);

function ChartTooltip({ active, payload, label, tempUnit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card rounded-lg px-3 py-2 text-xs" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          <span style={{ color: p.color }}>●</span>{" "}
          {p.dataKey === "temp" ? `${p.value}°${tempUnit}` : `${p.value}%`}
        </p>
      ))}
    </div>
  );
}

interface Props {
  location: string;
  lat: number;
  lon: number;
  measurementSystem: MeasurementSystem;
  onMarkerMove?: (lat: number, lon: number) => void;
  onClimateUpdate?: (avgTemp: number, avgHumidity: number) => void;
}

export default function LocationClimateData({ location, lat, lon, measurementSystem, onMarkerMove, onClimateUpdate }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const prefs = useMemo(() => getPreferredUnits(measurementSystem), [measurementSystem]);
  const tempUnit = "C" as const;
  const [climate, setClimate] = useState<ClimateData>(() => estimateFallback(lat));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchClimateData(lat, lon)
      .then((data) => { if (!cancelled) { setClimate(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setClimate(estimateFallback(lat)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [Math.round(lat * 100) / 100, Math.round(lon * 100) / 100]);

  // Notify parent of climate averages
  useEffect(() => {
    if (!loading && onClimateUpdate) {
      const avgT = Math.round(climate.temp.reduce((a, b) => a + b, 0) / 12);
      const avgH = Math.round(climate.humidity.reduce((a, b) => a + b, 0) / 12);
      onClimateUpdate(avgT, avgH);
    }
  }, [climate, loading]);

  const chartData = useMemo(
    () => MONTHS.map((month, i) => ({
      month,
      temp: tempUnit === "C" ? climate.temp[i] : toF(climate.temp[i]),
      humidity: climate.humidity[i],
    })),
    [climate, tempUnit]
  );

  const avgTemp = useMemo(() => {
    const avg = Math.round(climate.temp.reduce((a, b) => a + b, 0) / 12);
    return tempUnit === "C" ? avg : toF(avg);
  }, [climate, tempUnit]);

  const avgHumidity = useMemo(() => Math.round(climate.humidity.reduce((a, b) => a + b, 0) / 12), [climate]);

  useEffect(() => { setConfirmed(false); }, [location]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-5 space-y-5">
      <InteractiveMap lat={lat} lon={lon} onConfirm={() => setConfirmed(true)} onMarkerMove={onMarkerMove} confirmed={confirmed} />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/40 rounded-[12px] p-4 relative">
          <div className="flex items-center text-muted-foreground text-xs mb-1">
            <div className="flex items-center gap-2"><Thermometer className="w-3.5 h-3.5" /> Avg Temperature</div>
          </div>
          <span className={`text-2xl font-semibold text-foreground transition-opacity ${loading ? "opacity-40" : ""}`}>{avgTemp}°C</span>
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin absolute bottom-3 right-3" />}
        </div>
        <div className="bg-secondary/40 rounded-[12px] p-4 relative">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Droplets className="w-3.5 h-3.5" /> Avg Humidity
          </div>
          <span className={`text-2xl font-semibold text-foreground transition-opacity ${loading ? "opacity-40" : ""}`}>{avgHumidity}%</span>
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin absolute bottom-3 right-3" />}
        </div>
      </div>

      {/* Temperature Trend */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Monthly Temperature</h3>
        <div className={`h-[120px] transition-opacity ${loading ? "opacity-40" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210 100% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(210 100% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} unit={`°${tempUnit}`} />
              <Tooltip content={<ChartTooltip tempUnit={tempUnit} />} />
              <Area type="monotone" dataKey="temp" stroke="hsl(210 100% 45%)" strokeWidth={2} fill="url(#tempGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity Trend */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Monthly Humidity</h3>
        <div className={`h-[120px] transition-opacity ${loading ? "opacity-40" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200 80% 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(200 80% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<ChartTooltip tempUnit={tempUnit} />} />
              <Area type="monotone" dataKey="humidity" stroke="hsl(200 80% 55%)" strokeWidth={2} fill="url(#humidGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
