import { useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, MapPin, Volume2, ArrowDown } from "lucide-react";

export interface CaseStudy {
  id: string;
  title: string;
  location: string;
  lat: number;
  lon: number;
  mineral: string;
  equipment: string;
  preDb: number;
  postDb: number;
  reductionDb: number;
  distanceCloser?: number;
  url: string;
  highlight: string;
  thumbnail: string;
}

// Compiled from minetek.com/case-studies — sound attenuation projects
const CASE_STUDIES: CaseStudy[] = [
  {
    id: "komatsu-930e-5",
    title: "Central Tablelands Coal Mine",
    location: "Central Tablelands, NSW, Australia",
    lat: -33.7,
    lon: 149.8,
    mineral: "Coal",
    equipment: "Komatsu 930E-5 Haul Truck",
    preDb: 120,
    postDb: 115,
    reductionDb: 5,
    distanceCloser: 450,
    url: "https://minetek.com/case-studies/komatsu-930e-5-sound-attenuation/",
    highlight: "6 units completed on schedule with zero downtime",
    thumbnail: "https://minetek.com/wp-content/uploads/2024/05/Sound_Komatsu_HD930E_Haul_Truck.webp",
  },
  {
    id: "cat-993",
    title: "Darling Downs Coal Mine",
    location: "Darling Downs, QLD, Australia",
    lat: -27.6,
    lon: 151.1,
    mineral: "Coal",
    equipment: "Caterpillar 993 Loader",
    preDb: 115,
    postDb: 110,
    reductionDb: 5,
    distanceCloser: 450,
    url: "https://minetek.com/case-studies/caterpillar-993-sound-attenuation/",
    highlight: "Operations 450m closer to boundary while staying below 42 dBA",
    thumbnail: "https://minetek.com/wp-content/uploads/2025/07/Caterpillar-993.jpg",
  },
  {
    id: "hitachi-ex5600",
    title: "Darling Downs Coal Mine",
    location: "Darling Downs, QLD, Australia",
    lat: -27.6,
    lon: 151.1,
    mineral: "Coal",
    equipment: "Hitachi EX5600-7 Excavator",
    preDb: 120,
    postDb: 114,
    reductionDb: 6,
    url: "https://minetek.com/case-studies/hitachi-ex5600-7-sound-attenuation/",
    highlight: "Compliant operation below 42 dBA day, lower at night",
    thumbnail: "https://minetek.com/wp-content/uploads/2025/07/Hitachi-EX5600-7.jpg",
  },
  {
    id: "new-acland",
    title: "Queensland Coal Mine",
    location: "Acland, QLD, Australia",
    lat: -27.2,
    lon: 151.7,
    mineral: "Coal",
    equipment: "Site-wide Fleet (Multiple OEMs)",
    preDb: 0,
    postDb: 0,
    reductionDb: 0,
    url: "https://minetek.com/case-studies/new-acland-coal-mine/",
    highlight: "13+ year partnership — sustainable day & night operations",
    thumbnail: "https://minetek.com/wp-content/uploads/2024/05/Minetek-Sound-Australia-New-Acland-Coal-Mine-08.webp",
  },
  {
    id: "chile-copper",
    title: "Chile Copper Mine",
    location: "Coquimbo Region, Chile",
    lat: -30.0,
    lon: -71.3,
    mineral: "Copper",
    equipment: "Cat 789C, 789D & 994K",
    preDb: 0,
    postDb: 0,
    reductionDb: 0,
    url: "https://minetek.com/case-studies/chile-copper-mine-caterpillar-sound-attenuation/",
    highlight: "Noise reduced below regulatory thresholds near sensitive community",
    thumbnail: "https://minetek.com/wp-content/uploads/2024/07/Untitled-design-40.jpg",
  },
  {
    id: "cat-793d",
    title: "Hunter Valley Coal Mine",
    location: "Hunter Valley, NSW, Australia",
    lat: -32.75,
    lon: 151.15,
    mineral: "Coal",
    equipment: "Caterpillar 793D Haul Truck",
    preDb: 121,
    postDb: 111,
    reductionDb: 10,
    url: "https://minetek.com/resource-hub/downloads/caterpillar-793d-case-study/",
    highlight: "10 dBA reduction — one of the highest reductions achieved",
    thumbnail: "https://minetek.com/wp-content/uploads/2024/05/Sound_Komatsu_HD930E_Haul_Truck.webp",
  },
  {
    id: "liebherr-r9800",
    title: "Australian Open-Cut Mine",
    location: "Queensland, Australia",
    lat: -23.5,
    lon: 148.2,
    mineral: "Coal",
    equipment: "Liebherr R9800 Excavator",
    preDb: 0,
    postDb: 0,
    reductionDb: 0,
    url: "https://minetek.com/resource-hub/downloads/liebherr-r9800-case-study/",
    highlight: "World's first sound attenuation package for the R9800",
    thumbnail: "https://minetek.com/wp-content/uploads/2024/05/Minetek-Sound-Australia-New-Acland-Coal-Mine-08.webp",
  },
];

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CaseStudiesProps {
  userLat: number;
  userLon: number;
  radiusKm?: number;
  distanceUnit: string;
}

export default function CaseStudies({ userLat, userLon, radiusKm = 1000, distanceUnit }: CaseStudiesProps) {
  const nearby = useMemo(() => {
    return CASE_STUDIES.map((cs) => ({
      ...cs,
      distanceKm: haversineKm(userLat, userLon, cs.lat, cs.lon),
    }))
      .filter((cs) => cs.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLat, userLon, radiusKm]);

  // If no nearby, show all sorted by distance with a different header
  const showAll = nearby.length === 0;
  const studies = showAll
    ? CASE_STUDIES.map((cs) => ({
        ...cs,
        distanceKm: haversineKm(userLat, userLon, cs.lat, cs.lon),
      })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3)
    : nearby;

  const formatDistance = (km: number) => {
    if (distanceUnit === "ft") {
      const miles = km * 0.621371;
      return miles < 1 ? "<1 mi" : `${Math.round(miles).toLocaleString()} mi`;
    }
    return `${Math.round(km).toLocaleString()} km`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-label">
          {showAll ? "Minetek Sound Case Studies" : `Case Studies Within ${radiusKm.toLocaleString()} km`}
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {studies.length} {studies.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {showAll && (
        <p className="text-xs text-muted-foreground mb-4">
          No case studies within {radiusKm.toLocaleString()} km — showing nearest projects globally.
        </p>
      )}

      <div className="space-y-3">
        {studies.map((cs, i) => (
          <motion.a
            key={cs.id}
            href={cs.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="block bg-secondary/30 rounded-[12px] overflow-hidden hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex">
              {/* Thumbnail */}
              <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 relative overflow-hidden">
                <img
                  src={cs.thumbnail}
                  alt={cs.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{cs.title}</h3>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{cs.equipment}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {cs.location}
                        <span className="text-primary font-medium ml-1">({formatDistance(cs.distanceKm)})</span>
                      </span>

                      {cs.reductionDb > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <ArrowDown className="w-3 h-3" />
                          {cs.reductionDb} dB reduction
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-foreground/70 mt-2 italic">{cs.highlight}</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-center justify-center bg-primary/10 rounded-lg px-2 py-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wide text-primary">{cs.mineral}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href="https://minetek.com/case-studies/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all case studies on minetek.com →
        </a>
      </div>
    </div>
  );
}
