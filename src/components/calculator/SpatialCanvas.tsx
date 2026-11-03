import { useMemo } from "react";
import { motion } from "framer-motion";

interface SpatialCanvasProps {
  currentRadius: number;
  newRadius: number;
  boundaryDistance: number;
  distanceUnit: "m" | "ft";
}

/* ── SVG helper paths (quarter-circle, top-right quadrant from origin at bottom-left) ── */

/** Filled quarter-circle sector from origin */
function quarterArc(cx: number, cy: number, r: number): string {
  if (r <= 0) return "";
  return `M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx} ${cy - r} Z`;
}

/** Ring between two radii (quarter) */
function quarterRing(cx: number, cy: number, rOuter: number, rInner: number): string {
  if (rOuter <= rInner || rInner < 0) return "";
  return `
    M ${cx + rOuter} ${cy}
    A ${rOuter} ${rOuter} 0 0 0 ${cx} ${cy - rOuter}
    L ${cx} ${cy - rInner}
    A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy}
    Z
  `;
}

/** Quarter-circle arc (stroke only) */
function arcPath(cx: number, cy: number, r: number): string {
  if (r <= 0) return "";
  return `M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx} ${cy - r}`;
}

/* ── Speaker icon ── */
function SpeakerIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 10}, ${y - 10})`}>
      <circle cx="10" cy="10" r="14" fill="hsl(0 0% 8%)" stroke="hsl(0 0% 25%)" strokeWidth="1" />
      <path d="M5 8h2.5l3.5-3v10l-3.5-3H5a.8.8 0 01-.8-.8V8.8A.8.8 0 015 8z" fill="hsl(0 0% 80%)" />
      <path d="M13 7.5c1 1 1 5 0 6" fill="none" stroke="hsl(0 0% 55%)" strokeWidth="1" strokeLinecap="round" />
      <path d="M15.5 5.5c1.8 1.8 1.8 9 0 10.8" fill="none" stroke="hsl(0 0% 40%)" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/* ── Colours ── */
const C = {
  bg: "hsl(220 15% 8%)",
  grid: "hsl(220 10% 18%)",
  gridText: "hsl(220 5% 40%)",
  axis: "hsl(220 10% 25%)",
  // Noise / restricted zone
  noiseHatch: "hsl(0 0% 50%)",
  noiseFill: "hsl(220 8% 15% / 0.6)",
  noiseArc: "hsl(0 0% 50%)",
  // Reclaimed zone
  reclaimedFill: "hsl(215 80% 50% / 0.15)",
  reclaimedCross: "hsl(215 80% 55%)",
  reclaimedArc: "hsl(215 80% 55%)",
  // Boundary
  boundaryArc: "hsl(0 0% 55%)",
  // Labels
  label: "hsl(0 0% 70%)",
  labelBright: "hsl(0 0% 85%)",
  primary: "hsl(215 80% 55%)",
};

export default function SpatialCanvas({
  currentRadius,
  newRadius,
  boundaryDistance,
}: SpatialCanvasProps) {
  const size = 460;
  const pad = 52;
  const ox = pad;            // origin x (bottom-left)
  const oy = size - pad;     // origin y (bottom-left)
  const drawSize = size - pad * 2;

  // Scale everything so boundary fills the canvas
  const maxR = Math.max(boundaryDistance, currentRadius, 100);
  const scale = drawSize / maxR;

  const curR = currentRadius * scale;   // original noise radius (px)
  const newR = newRadius * scale;       // suppressed noise radius (px)
  const bndR = boundaryDistance * scale; // boundary (px)

  const hasSuppression = currentRadius > newRadius && newRadius >= 0;

  // Grid lines
  const gridLines = useMemo(() => {
    const step = maxR > 500 ? 200 : maxR > 200 ? 100 : 50;
    const lines: { r: number; label: number }[] = [];
    for (let v = step; v <= maxR * 1.15; v += step) {
      lines.push({ r: v * scale, label: v });
    }
    return lines;
  }, [maxR, scale]);

  // Pattern IDs
  const hatchId = "hatch-noise";
  const crossId = "cross-reclaimed";

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
        style={{ maxHeight: 460, background: C.bg, borderRadius: 16 }}
      >
        <defs>
          {/* Diagonal hatch for noise zone */}
          <pattern id={hatchId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke={C.noiseHatch} strokeWidth="0.7" opacity="0.45" />
          </pattern>
          {/* Cross pattern for reclaimed area */}
          <pattern id={crossId} width="14" height="14" patternUnits="userSpaceOnUse">
            <line x1="3" y1="3" x2="11" y2="11" stroke={C.reclaimedCross} strokeWidth="1.2" opacity="0.45" />
            <line x1="11" y1="3" x2="3" y2="11" stroke={C.reclaimedCross} strokeWidth="1.2" opacity="0.45" />
          </pattern>
        </defs>

        {/* ── Grid arcs ── */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <path d={arcPath(ox, oy, g.r)} fill="none" stroke={C.grid} strokeWidth={0.5} />
            <text x={ox + g.r} y={oy + 16} fontSize="9" fill={C.gridText} fontFamily="'Geist Mono', monospace" textAnchor="middle">
              {g.label}m
            </text>
            <text x={ox - 6} y={oy - g.r + 3} fontSize="9" fill={C.gridText} fontFamily="'Geist Mono', monospace" textAnchor="end">
              {g.label}
            </text>
          </g>
        ))}

        {/* ── Axes ── */}
        <line x1={ox} y1={oy} x2={size - 8} y2={oy} stroke={C.axis} strokeWidth={0.7} />
        <line x1={ox} y1={oy} x2={ox} y2={8} stroke={C.axis} strokeWidth={0.7} />

        {/* ══════════════════════════════════════════
            FIGURE 1 — No suppression (or base state)
            Hatched noise zone from origin → currentR
            Gap between currentR → boundary = suppressed area
            ══════════════════════════════════════════ */}

        {/* Suppressed area fill: ring from currentR (or newR if suppressed) to boundary */}
        {hasSuppression ? (
          <>
            {/* Existing operational area: original noise → boundary (subtle fill) */}
            <motion.path
              d={quarterRing(ox, oy, bndR, curR)}
              fill="hsl(215 30% 25% / 0.08)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          </>
        ) : (
          /* No suppression: show suppressed area label zone */
          <motion.path
            d={quarterRing(ox, oy, bndR, curR)}
            fill="hsl(215 30% 25% / 0.06)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* ══════════════════════════════════════════
            FIGURE 2 — With suppression
            Reclaimed area: ring from newR → currentR (Xs)
            ══════════════════════════════════════════ */}
        {hasSuppression && (
          <>
            {/* Reclaimed zone fill */}
            <motion.path
              d={quarterRing(ox, oy, curR, newR)}
              fill={C.reclaimedFill}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Cross-hatch overlay */}
            <motion.path
              d={quarterRing(ox, oy, curR, newR)}
              fill={`url(#${crossId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            {/* Reclaimed zone border */}
            <motion.path
              d={quarterRing(ox, oy, curR, newR)}
              fill="none"
              stroke={C.reclaimedArc}
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          </>
        )}

        {/* Noise zone: hatched area from origin → noise radius */}
        <motion.path
          d={quarterArc(ox, oy, hasSuppression ? newR : curR)}
          fill={C.noiseFill}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d={quarterArc(ox, oy, hasSuppression ? newR : curR)}
          fill={`url(#${hatchId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Original noise arc (A) — solid */}
        <motion.path
          d={arcPath(ox, oy, curR)}
          fill="none"
          stroke={C.noiseArc}
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* New noise arc (B) — when suppressed */}
        {hasSuppression && (
          <motion.path
            d={arcPath(ox, oy, newR)}
            fill="none"
            stroke={C.reclaimedArc}
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        )}

        {/* Site boundary arc — dashed */}
        <motion.path
          d={arcPath(ox, oy, bndR)}
          fill="none"
          stroke={C.boundaryArc}
          strokeWidth={1.5}
          strokeDasharray="10 6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* ── Sound source icon ── */}
        <SpeakerIcon x={ox} y={oy} />

        {/* ── Labels ── */}

        {/* "A" label on x-axis at original noise radius */}
        <text x={ox + curR} y={oy + 28} fontSize="13" fill={C.label} fontWeight="700" fontFamily="'Geist Mono', monospace" textAnchor="middle">
          A
        </text>
        <text x={ox + curR} y={oy + 40} fontSize="9" fill={C.gridText} fontFamily="'Geist Mono', monospace" textAnchor="middle">
          {currentRadius}m
        </text>

        {/* "B" label on x-axis at new noise radius */}
        {hasSuppression && Math.abs(curR - newR) > 18 && (
          <>
            <text x={ox + newR} y={oy + 28} fontSize="13" fill={C.primary} fontWeight="700" fontFamily="'Geist Mono', monospace" textAnchor="middle">
              B
            </text>
            <text x={ox + newR} y={oy + 40} fontSize="9" fill={C.primary} fontFamily="'Geist Mono', monospace" textAnchor="middle">
              {newRadius}m
            </text>
          </>
        )}

        {/* A→B arrow */}
        {hasSuppression && curR - newR > 30 && (
          <g>
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={C.primary} />
              </marker>
            </defs>
            <line
              x1={ox + curR - 4}
              y1={oy + 50}
              x2={ox + newR + 8}
              y2={oy + 50}
              stroke={C.primary}
              strokeWidth={1.2}
              markerEnd="url(#arr)"
            />
          </g>
        )}

        {/* Boundary label along the arc */}
        <text
          x={ox + bndR * Math.cos(Math.PI / 5) + 4}
          y={oy - bndR * Math.sin(Math.PI / 5) - 6}
          fontSize="10"
          fill={C.boundaryArc}
          fontFamily="'Geist Mono', monospace"
          fontWeight="600"
        >
          Site Boundary
        </text>

        {/* Suppressed Area label (in the gap between noise and boundary) — Figure 1 style */}
        {!hasSuppression && curR < bndR - 20 && (
          <text
            x={ox + (curR + bndR) / 2 * Math.cos(Math.PI / 7)}
            y={oy - (curR + bndR) / 2 * Math.sin(Math.PI / 7)}
            fontSize="10"
            fill={C.label}
            fontFamily="'Inter', sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            Operational Area
          </text>
        )}

        {/* Reclaimed label inside the Xs ring */}
        {hasSuppression && curR - newR > 40 && (
          <text
            x={ox + (curR + newR) / 2 * Math.cos(Math.PI / 4)}
            y={oy - (curR + newR) / 2 * Math.sin(Math.PI / 4)}
            fontSize="10"
            fill={C.primary}
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            +{currentRadius - newRadius}m Reclaimed
          </text>
        )}

        {/* Noise Zone label */}
        {(hasSuppression ? newR : curR) > 50 && (
          <text
            x={ox + (hasSuppression ? newR : curR) * 0.45 * Math.cos(Math.PI / 4)}
            y={oy - (hasSuppression ? newR : curR) * 0.45 * Math.sin(Math.PI / 4)}
            fontSize="9"
            fill={C.noiseHatch}
            fontFamily="'Inter', sans-serif"
            fontWeight="500"
            textAnchor="middle"
            opacity={0.8}
          >
            Noise Zone
          </text>
        )}

        {/* ── Legend ── */}
        <g transform={`translate(${size - 190}, 14)`}>
          <rect x={-8} y={-6} width={194} height={hasSuppression ? 92 : 58} rx={8} fill="hsl(220 15% 6% / 0.85)" stroke="hsl(220 10% 20%)" strokeWidth={0.5} />

          {/* Noise zone */}
          <rect y={2} width={12} height={8} rx={2} fill={C.noiseFill} />
          <line x1="1" y1="3" x2="11" y2="10" stroke={C.noiseHatch} strokeWidth={0.6} />
          <text x={18} y={10} fontSize="9" fill={C.label} fontFamily="'Inter', sans-serif">Noise Zone (Restricted)</text>

          {/* Boundary */}
          <line x1={0} y1={22} x2={12} y2={22} stroke={C.boundaryArc} strokeWidth={1.2} strokeDasharray="3 2" />
          <text x={18} y={26} fontSize="9" fill={C.label} fontFamily="'Inter', sans-serif">Site Boundary</text>

          {hasSuppression && (
            <>
              {/* Reclaimed */}
              <rect y={36} width={12} height={8} rx={2} fill={C.reclaimedFill} stroke={C.reclaimedArc} strokeWidth={0.6} />
              <line x1="2" y1="38" x2="10" y2="44" stroke={C.reclaimedCross} strokeWidth={0.6} />
              <line x1="10" y1="38" x2="2" y2="44" stroke={C.reclaimedCross} strokeWidth={0.6} />
              <text x={18} y={44} fontSize="9" fill={C.label} fontFamily="'Inter', sans-serif">Reclaimed Area (A → B)</text>

              {/* Original radius */}
              <line x1={0} y1={56} x2={12} y2={56} stroke={C.noiseArc} strokeWidth={1.2} />
              <text x={18} y={60} fontSize="9" fill={C.label} fontFamily="'Inter', sans-serif">Original Noise Radius (A)</text>

              {/* Suppressed radius */}
              <line x1={0} y1={72} x2={12} y2={72} stroke={C.reclaimedArc} strokeWidth={1.2} />
              <text x={18} y={76} fontSize="9" fill={C.label} fontFamily="'Inter', sans-serif">Suppressed Radius (B)</text>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
