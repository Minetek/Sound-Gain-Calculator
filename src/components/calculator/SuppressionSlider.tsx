import { motion } from "framer-motion";

interface SuppressionSliderProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

export default function SuppressionSlider({ value, onChange, max = 15 }: SuppressionSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Minetek Suppression Level
        </h3>
        <motion.span
          key={value}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-metric text-2xl font-bold text-primary"
        >
          -{value} dB
        </motion.span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(210 100% 45%) 0%, hsl(210 100% 45%) ${(value / max) * 100}%, hsl(220 10% 88%) ${(value / max) * 100}%, hsl(220 10% 88%) 100%)`,
          }}
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
          <span>0 dB</span>
          <span>-{Math.round(max / 2)} dB</span>
          <span>-{max} dB</span>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Based on Minetek data:</span> Komatsu 930E achieved 13dB reduction. 
        Typical packages deliver 8–15dB across 90+ OEM models and 3,000+ machines globally.
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(210 100% 45%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          border: 3px solid white;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(210 100% 45%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          border: 3px solid white;
        }
      `}</style>
    </div>
  );
}
