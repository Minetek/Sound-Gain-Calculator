import { Volume2, Target, Clock, DollarSign, Truck, TrendingUp } from "lucide-react";

// Equipment types based on Minetek's product range (minetek.com/products/?cat=sound)
// Typical dB levels at 1m reference distance
export const EQUIPMENT_TYPES = [
  { id: "haul_truck", label: "Haul Truck", db: 115, examples: "Cat 777/785/789/793, Komatsu 930E" },
  { id: "excavator", label: "Excavator", db: 112, examples: "Liebherr R9800, Hitachi EX series" },
  { id: "dozer", label: "Dozer", db: 110, examples: "Cat D10/D11" },
  { id: "loader", label: "Loader", db: 113, examples: "Cat 992, LeTourneau" },
  { id: "drill", label: "Drill Rig", db: 118, examples: "Sandvik, Epiroc" },
  { id: "grader", label: "Grader", db: 108, examples: "Cat 16M/24M" },
  { id: "water_truck", label: "Water / Service Truck", db: 109, examples: "Cat 777 Water" },
  { id: "generator", label: "Generator", db: 105, examples: "Site power generation" },
  { id: "crusher", label: "Crusher / Fixed Plant", db: 120, examples: "Primary & secondary crushers" },
  { id: "custom", label: "Custom", db: 0, examples: "Enter your own dB level" },
] as const;

export type EquipmentTypeId = typeof EQUIPMENT_TYPES[number]["id"];

interface MachineInputsProps {
  sourceDb: number;
  boundaryLimit: number;
  boundaryDistance: number;
  commodityPrice: number;
  productionRate: number;
  hourlyRevenue: number;
  shiftHours: number;
  restrictedHours: number;
  equipmentType: EquipmentTypeId;
  onEquipmentTypeChange: (id: EquipmentTypeId) => void;
  onSourceDbChange: (v: number) => void;
  onBoundaryLimitChange: (v: number) => void;
  onBoundaryDistanceChange: (v: number) => void;
  onCommodityPriceChange: (v: number) => void;
  onProductionRateChange: (v: number) => void;
  onShiftHoursChange: (v: number) => void;
  onRestrictedHoursChange: (v: number) => void;
  currencySymbol: string;
  distanceUnit: string;
}

function InputField({ icon, label, value, onChange, unit, min, max, step = 1 }: {
  icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void;
  unit: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <span className="text-sm text-secondary-foreground">{label}</span>
      </div>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min ?? 0, Number(e.target.value)))}
          min={min}
          max={max}
          step={step}
          className="w-full bg-secondary/50 text-foreground text-metric text-sm pl-4 pr-16 py-3 rounded-[12px] border-none outline-none focus:ring-2 focus:ring-primary/40 transition-shadow duration-200"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export default function MachineInputs(props: MachineInputsProps) {
  const selectedEquipment = EQUIPMENT_TYPES.find(e => e.id === props.equipmentType);

  return (
    <div className="space-y-5">
      {/* Equipment Type Selector */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Equipment Type</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-primary"><Truck className="w-4 h-4" /></span>
          <span className="text-sm text-secondary-foreground">Select Equipment</span>
        </div>
        <select
          value={props.equipmentType}
          onChange={(e) => props.onEquipmentTypeChange(e.target.value as EquipmentTypeId)}
          className="w-full bg-secondary/50 text-foreground text-sm px-4 py-3 rounded-[12px] border-none outline-none focus:ring-2 focus:ring-primary/40 transition-shadow duration-200 cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        >
          {EQUIPMENT_TYPES.map(eq => (
            <option key={eq.id} value={eq.id}>
              {eq.label} {eq.id !== "custom" ? `(~${eq.db} dB)` : ""}
            </option>
          ))}
        </select>
        {selectedEquipment && selectedEquipment.id !== "custom" && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            e.g. {selectedEquipment.examples}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Machine Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField icon={<Volume2 className="w-4 h-4" />} label="Source Noise Level" value={props.sourceDb} onChange={props.onSourceDbChange} unit="dB" min={40} max={150} />
          <InputField icon={<Target className="w-4 h-4" />} label="Boundary Noise Limit" value={props.boundaryLimit} onChange={props.onBoundaryLimitChange} unit="dB" min={20} max={100} />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Site Constraints</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField icon={<Target className="w-4 h-4" />} label="Distance to Boundary" value={props.boundaryDistance} onChange={props.onBoundaryDistanceChange} unit={props.distanceUnit} min={10} max={10000} />
          <InputField icon={<Clock className="w-4 h-4" />} label="Standard Shift" value={props.shiftHours} onChange={props.onShiftHoursChange} unit="hours" min={1} max={24} />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Revenue Estimation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField icon={<DollarSign className="w-4 h-4" />} label="Coal Price" value={props.commodityPrice} onChange={props.onCommodityPriceChange} unit={`${props.currencySymbol}/t`} min={0} step={5} />
          <InputField icon={<TrendingUp className="w-4 h-4" />} label="Production Rate" value={props.productionRate} onChange={props.onProductionRateChange} unit="t/hr" min={0} step={50} />
        </div>
        <div className="mt-3 p-3 bg-primary/5 rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estimated Hourly Revenue</span>
            <span className="text-sm font-bold text-primary font-mono">{props.currencySymbol}{props.hourlyRevenue.toLocaleString()}/hr</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Based on Newcastle benchmark coal price × site production rate
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Operating Constraints</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField icon={<Clock className="w-4 h-4" />} label="Restricted Hours/Day" value={props.restrictedHours} onChange={props.onRestrictedHoursChange} unit="hours" min={0} max={24} step={0.5} />
        </div>
      </div>
    </div>
  );
}
