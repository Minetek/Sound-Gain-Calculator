/**
 * Sound propagation and ROI calculations for Minetek Sound division.
 * 
 * Uses inverse square law: Distance2 = Distance1 * 10^((dB_reduction)/20)
 * A 10dB reduction effectively doubles the allowed distance from a boundary.
 */

export interface SoundCalcInputs {
  sourceDb: number;         // Machine noise level in dB
  boundaryLimit: number;    // Regulatory noise limit in dB at boundary
  boundaryDistance: number;  // Current distance to boundary in metres
  suppressionDb: number;    // Minetek suppression reduction in dB
  hourlyRevenue: number;    // Revenue per operating hour (USD)
  shiftHours: number;       // Standard shift length in hours
  restrictedHours: number;  // Hours currently restricted due to noise
  temperature: number;      // °C — affects sound propagation
  humidity: number;         // % — affects atmospheric absorption
}

export interface SoundCalcResults {
  // Distances
  currentExclusionRadius: number;  // metres — current noise contour at limit
  newExclusionRadius: number;      // metres — reduced radius after suppression
  distanceSaved: number;           // metres closer to boundary

  // Areas
  currentExclusionArea: number;    // m² exclusion zone
  newExclusionArea: number;        // m² reduced zone
  areaReclaimed: number;           // m² gained
  areaReclaimedPercent: number;    // % increase in operational area

  // Financial
  extraHoursPerDay: number;
  monthlyRevenuGain: number;
  annualRevenueGain: number;

  // Atmospheric factor
  atmosphericFactor: number;       // multiplier for sound propagation
}

/**
 * Calculate exclusion radius — the distance at which source dB decays to the limit.
 * Using: dB_at_distance = sourceDb - 20*log10(distance/referenceDistance)
 * Solving for distance where dB_at_distance = limit:
 *   distance = referenceDistance * 10^((sourceDb - limit) / 20)
 * 
 * We normalise to 1m reference distance.
 */
export function calculateExclusionRadius(sourceDb: number, limitDb: number, atmosphericFactor: number = 1): number {
  if (sourceDb <= limitDb) return 0;
  const radius = Math.pow(10, (sourceDb - limitDb) / 20) * atmosphericFactor;
  return Math.round(radius * 10) / 10;
}

/**
 * Atmospheric absorption factor based on temperature and humidity.
 * Cold, dry air carries sound further. Hot, humid air absorbs more.
 * Returns a multiplier (>1 means sound carries further).
 */
export function getAtmosphericFactor(tempC: number, humidity: number): number {
  // Baseline at 20°C, 50% humidity = 1.0
  const tempFactor = 1 + (20 - tempC) * 0.008; // Cold = carries further
  const humidityFactor = 1 + (50 - humidity) * 0.003; // Dry = carries further
  return Math.max(0.7, Math.min(1.5, tempFactor * humidityFactor));
}

export function calculateSoundResults(inputs: SoundCalcInputs): SoundCalcResults {
  const atmosphericFactor = getAtmosphericFactor(inputs.temperature, inputs.humidity);

  const effectiveSourceDb = inputs.sourceDb;
  const suppressedDb = effectiveSourceDb - inputs.suppressionDb;

  const currentExclusionRadius = calculateExclusionRadius(effectiveSourceDb, inputs.boundaryLimit, atmosphericFactor);
  const newExclusionRadius = calculateExclusionRadius(suppressedDb, inputs.boundaryLimit, atmosphericFactor);

  const distanceSaved = Math.max(0, currentExclusionRadius - newExclusionRadius);

  const currentExclusionArea = Math.PI * Math.pow(currentExclusionRadius, 2);
  const newExclusionArea = Math.PI * Math.pow(newExclusionRadius, 2);
  const areaReclaimed = Math.max(0, currentExclusionArea - newExclusionArea);
  const areaReclaimedPercent = currentExclusionArea > 0 
    ? (areaReclaimed / currentExclusionArea) * 100 
    : 0;

  // Extra operating hours: assume suppression allows operation during restricted hours
  const extraHoursPerDay = inputs.suppressionDb > 0 
    ? Math.min(inputs.restrictedHours, inputs.restrictedHours * (inputs.suppressionDb / 20))
    : 0;
  
  const monthlyRevenuGain = extraHoursPerDay * inputs.hourlyRevenue * 30;
  const annualRevenueGain = monthlyRevenuGain * 12;

  return {
    currentExclusionRadius: Math.round(currentExclusionRadius),
    newExclusionRadius: Math.round(newExclusionRadius),
    distanceSaved: Math.round(distanceSaved),
    currentExclusionArea: Math.round(currentExclusionArea),
    newExclusionArea: Math.round(newExclusionArea),
    areaReclaimed: Math.round(areaReclaimed),
    areaReclaimedPercent: Math.round(areaReclaimedPercent * 10) / 10,
    extraHoursPerDay: Math.round(extraHoursPerDay * 10) / 10,
    monthlyRevenuGain: Math.round(monthlyRevenuGain),
    annualRevenueGain: Math.round(annualRevenueGain),
    atmosphericFactor: Math.round(atmosphericFactor * 100) / 100,
  };
}
