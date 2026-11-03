import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import minetekLogo from "@/assets/minetek-logo-white.png";
import { motion } from "framer-motion";
import { MapPin, Volume2, SlidersHorizontal, DollarSign, BookOpen, RotateCcw } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LocationInput, { type LocationData } from "@/components/calculator/LocationInput";
import LocationClimateData from "@/components/calculator/LocationClimateData";
import MachineInputs, { EQUIPMENT_TYPES, type EquipmentTypeId } from "@/components/calculator/MachineInputs";
import SuppressionSlider from "@/components/calculator/SuppressionSlider";
import SpatialCanvas from "@/components/calculator/SpatialCanvas";
import StatCard from "@/components/calculator/StatCard";
import CurrencySelector from "@/components/calculator/CurrencySelector";
import AnimatedNumber from "@/components/calculator/AnimatedNumber";
import CaseStudies from "@/components/calculator/CaseStudies";
import { detectSystem, getPreferredUnits, type MeasurementSystem } from "@/lib/measurement";
import { detectCurrency, convertCurrency, type CurrencyConfig, CURRENCIES } from "@/lib/currency";
import { calculateSoundResults, type SoundCalcInputs } from "@/lib/sound";

const appleEasing = [0.2, 0, 0, 1] as const;

interface ModuleProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Module({ icon, title, children, delay = 0 }: ModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [...appleEasing] }}
      className="surface-card module-focus p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-primary">{icon}</span>
        <h2 className="text-label">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function Index() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const reverseGeocodeRef = useRef<ReturnType<typeof setTimeout>>();

  // Machine inputs
  // Realistic defaults based on Minetek case studies:
  // Komatsu 930E: 13dB reduction, typical haul trucks: 110-120dB at 1m reference
  const [equipmentType, setEquipmentType] = useState<EquipmentTypeId>("haul_truck");
  const [sourceDb, setSourceDb] = useState(115);
  const [boundaryLimit, setBoundaryLimit] = useState(55);
  const [boundaryDistance, setBoundaryDistance] = useState(200);
  const [suppressionDb, setSuppressionDb] = useState(0);
  // Coal price ~$140 USD/t (Newcastle benchmark March 2026)
  // Typical open-cut coal mine production: ~1,100 t/hr per truck fleet
  const [commodityPrice, setCommodityPrice] = useState(140);
  const [productionRate, setProductionRate] = useState(1100);
  const hourlyRevenue = useMemo(() => Math.round(commodityPrice * productionRate * 0.25), [commodityPrice, productionRate]);
  // 0.25 = ~25% operating margin (revenue after mining costs)
  const [shiftHours, setShiftHours] = useState(12);
  const [restrictedHours, setRestrictedHours] = useState(6);
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(50);
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[1]); // AUD default

  const resetAll = useCallback(() => {
    setEquipmentType("haul_truck");
    setSourceDb(115);
    setBoundaryLimit(55);
    setBoundaryDistance(200);
    setSuppressionDb(0);
    setCommodityPrice(140);
    setProductionRate(1100);
    setShiftHours(12);
    setRestrictedHours(6);
    setTemperature(20);
    setHumidity(50);
  }, []);

  // Auto-detect location
  useEffect(() => {
    async function detectLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const name = [data.city, data.region, data.country_name].filter(Boolean).join(", ");
          setLocationData({ name: name || `${data.latitude}, ${data.longitude}`, lat: data.latitude, lon: data.longitude });
        }
      } catch {
        setLocationData({ name: "Hunter Valley, New South Wales, Australia", lat: -32.75, lon: 151.15 });
      }
    }
    detectLocation();
  }, []);

  const measurementSystem: MeasurementSystem = "metric";
  const prefs = useMemo(() => getPreferredUnits(measurementSystem), [measurementSystem]);

  useEffect(() => {
    if (locationData) setCurrency(detectCurrency(locationData.name));
  }, [locationData?.name]);

  const handleMarkerMove = useCallback((lat: number, lon: number) => {
    clearTimeout(reverseGeocodeRef.current);
    reverseGeocodeRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        if (data.display_name) setLocationData({ name: data.display_name, lat, lon });
      } catch {
        setLocationData((prev) => prev ? { ...prev, lat, lon } : { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon });
      }
    }, 500);
  }, []);

  const handleClimateUpdate = useCallback((avgTemp: number, avgHumidity: number) => {
    setTemperature(avgTemp);
    setHumidity(avgHumidity);
  }, []);

  const inputs: SoundCalcInputs = useMemo(() => ({
    sourceDb, boundaryLimit, boundaryDistance, suppressionDb,
    hourlyRevenue, shiftHours, restrictedHours, temperature, humidity,
  }), [sourceDb, boundaryLimit, boundaryDistance, suppressionDb, hourlyRevenue, shiftHours, restrictedHours, temperature, humidity]);

  const results = useMemo(() => calculateSoundResults(inputs), [inputs]);

  const distanceUnit = prefs.distance;
  const areaUnit = prefs.area;
  const mToFt = (m: number) => Math.round(m * 3.28084);
  const m2ToFt2 = (m2: number) => Math.round(m2 * 10.7639);
  const convertDist = distanceUnit === "ft" ? mToFt : (v: number) => v;
  const convertArea = areaUnit === "ft²" ? m2ToFt2 : (v: number) => v;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [...appleEasing] }}
        className="px-6 py-4"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={minetekLogo} alt="Minetek" className="h-[48px] w-auto logo-light-invert" />
            <div className="h-[48px] w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight" style={{ textWrap: "balance" }}>
                Minetek <span className="text-primary">Sound</span>
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Boundary Rider Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              title="Reset all inputs to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-muted-foreground">minetek.com</span>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-8">

        {/* ROI Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <StatCard label="Area Reclaimed" value={convertArea(results.areaReclaimed)} suffix={areaUnit} trend="up" />
          <StatCard label="Extra Ops Hours" value={results.extraHoursPerDay} suffix="h/day" decimals={1} trend="up" />
          <StatCard
            label="Est. Monthly Gain"
            value={convertCurrency(results.monthlyRevenuGain, currency)}
            prefix={currency.symbol}
            trend="up"
            primary
          />
          {(() => {
            const investmentCost = 250000;
            const months = results.monthlyRevenuGain > 0 ? investmentCost / results.monthlyRevenuGain : 0;
            const days = months * 30.44;
            let paybackValue: number;
            let paybackSuffix: string;
            if (days < 1) { paybackValue = 0; paybackSuffix = " days"; }
            else if (days < 14) { paybackValue = Math.round(days); paybackSuffix = days === 1 ? " day" : " days"; }
            else if (days < 60) { paybackValue = Math.round(days / 7 * 10) / 10; paybackSuffix = paybackValue === 1 ? " week" : " weeks"; }
            else if (months < 24) { paybackValue = Math.round(months * 10) / 10; paybackSuffix = paybackValue === 1 ? " month" : " months"; }
            else { paybackValue = Math.round(months / 12 * 10) / 10; paybackSuffix = paybackValue === 1 ? " year" : " years"; }
            return (
              <StatCard
                label="Est. Payback Period"
                value={paybackValue}
                suffix={paybackSuffix}
                decimals={paybackValue < 10 ? 1 : 0}
                trend="down"
                primary
              />
            );
          })()}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column — Inputs */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-5">
            <Module icon={<Volume2 className="w-4 h-4" />} title="Machine & Site Parameters" delay={0}>
              <MachineInputs
                equipmentType={equipmentType}
                onEquipmentTypeChange={(id) => {
                  setEquipmentType(id);
                  const eq = EQUIPMENT_TYPES.find(e => e.id === id);
                  if (eq && eq.id !== "custom") setSourceDb(eq.db);
                }}
                sourceDb={sourceDb}
                boundaryLimit={boundaryLimit}
                boundaryDistance={boundaryDistance}
                commodityPrice={commodityPrice}
                productionRate={productionRate}
                hourlyRevenue={hourlyRevenue}
                shiftHours={shiftHours}
                restrictedHours={restrictedHours}
                onSourceDbChange={setSourceDb}
                onBoundaryLimitChange={setBoundaryLimit}
                onBoundaryDistanceChange={setBoundaryDistance}
                onCommodityPriceChange={setCommodityPrice}
                onProductionRateChange={setProductionRate}
                onShiftHoursChange={setShiftHours}
                onRestrictedHoursChange={setRestrictedHours}
                currencySymbol={currency.symbol}
                distanceUnit={distanceUnit}
              />
            </Module>


            {/* Financial Impact Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [...appleEasing] }}
              className="surface-card p-6"
            >
              <h2 className="text-label mb-4">Financial Impact Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Current Exclusion Radius</div>
                  <div className="text-xl font-semibold text-foreground text-metric">
                    <AnimatedNumber value={convertDist(results.currentExclusionRadius)} suffix={distanceUnit} />
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Suppressed Radius</div>
                  <div className="text-xl font-semibold text-primary text-metric">
                    <AnimatedNumber value={convertDist(results.newExclusionRadius)} suffix={distanceUnit} />
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Area Reclaimed (%)</div>
                  <div className="text-xl font-semibold text-success text-metric">
                    <AnimatedNumber value={results.areaReclaimedPercent} suffix="%" decimals={1} />
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Extra Hours / Day</div>
                  <div className="text-xl font-semibold text-foreground text-metric">
                    <AnimatedNumber value={results.extraHoursPerDay} suffix="h" decimals={1} />
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Monthly Revenue Gain</div>
                  <div className="text-xl font-semibold text-foreground text-metric">
                    <AnimatedNumber value={convertCurrency(results.monthlyRevenuGain, currency)} prefix={currency.symbol} />
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-[12px] p-4">
                  <div className="text-xs text-muted-foreground mb-1">Annual Revenue Gain</div>
                  <div className="text-xl font-semibold text-primary text-metric">
                    <AnimatedNumber value={convertCurrency(results.annualRevenueGain, currency)} prefix={currency.symbol} />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary/5 rounded-[12px]">
                <p className="text-xs text-foreground">
                  Suppressing by <span className="font-bold text-primary">{suppressionDb}dB</span> reduces the exclusion zone from{" "}
                  <span className="font-mono font-semibold">{convertDist(results.currentExclusionRadius).toLocaleString()}{distanceUnit}</span> to{" "}
                  <span className="font-mono font-semibold text-primary">{convertDist(results.newExclusionRadius).toLocaleString()}{distanceUnit}</span>,
                  reclaiming <span className="font-mono font-semibold text-success">{convertArea(results.areaReclaimed).toLocaleString()}{areaUnit}</span> of operational area
                  ({results.areaReclaimedPercent}% increase).
                </p>
              </div>
            </motion.div>

            {/* Video Section */}
            {locationData && (
              <Module icon={<Volume2 className="w-4 h-4" />} title="Real-World Results" delay={0.2}>
                <p className="text-sm text-muted-foreground mb-4">
                  Find out how we delivered noise reductions at a site similar to your{" "}
                  <span className="font-semibold text-foreground">{locationData.name}</span> location.
                </p>
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/jdpJuKnPXWE"
                    title="Minetek Sound – Noise Reduction Case Study"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex justify-center pt-4">
                  <a href="https://minetek.com/contact/" target="_blank" rel="noopener noreferrer" className="minetek-cta-primary">
                    Get Full Acoustic Engineering Analysis
                    <span className="minetek-cta-dot" />
                  </a>
                </div>
              </Module>
            )}
          </div>

          {/* Right Column — Visualization */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Spatial Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [...appleEasing] }}
              className="surface-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-label">Acoustic Footprint — Overhead View</h2>
                <div className="flex items-center gap-3">
                  <CurrencySelector value={currency} onChange={setCurrency} />
                  <span className="text-xs text-muted-foreground font-mono">
                    Atm. Factor: {results.atmosphericFactor}×
                  </span>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4" style={{ minHeight: 400 }}>
                <SpatialCanvas
                  currentRadius={results.currentExclusionRadius}
                  newRadius={results.newExclusionRadius}
                  boundaryDistance={boundaryDistance}
                  distanceUnit={distanceUnit}
                />
              </div>
            </motion.div>

            <Module icon={<SlidersHorizontal className="w-4 h-4" />} title="Suppression Control" delay={0.05}>
              <SuppressionSlider value={suppressionDb} onChange={setSuppressionDb} />
            </Module>

            <Module icon={<MapPin className="w-4 h-4" />} title="Site Location" delay={0.08}>
              <LocationInput value={locationData} onChange={setLocationData} />
            </Module>

            {/* Weather & Climate Data */}
            {locationData && (
              <Module icon={<MapPin className="w-4 h-4" />} title="Site Weather & Climate" delay={0.12}>
                <LocationClimateData
                  location={locationData.name}
                  lat={locationData.lat}
                  lon={locationData.lon}
                  measurementSystem={measurementSystem}
                  onMarkerMove={handleMarkerMove}
                  onClimateUpdate={handleClimateUpdate}
                />
              </Module>
            )}

            {/* Case Studies */}
            {locationData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.2, 0, 0, 1] }}
                className="surface-card p-6"
              >
                <CaseStudies
                  userLat={locationData.lat}
                  userLon={locationData.lon}
                  distanceUnit={distanceUnit}
                />
              </motion.div>
            )}

          </div>
        </div>

        <div className="mt-8 pb-8 text-center text-xs text-muted-foreground">
          Results are estimates for comparison purposes. Contact Minetek for detailed acoustic engineering analysis.
        </div>
      </div>
    </div>
  );
}
