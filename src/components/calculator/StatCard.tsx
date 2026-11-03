import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: "up" | "down";
  primary?: boolean;
}

export default function StatCard({ label, value, prefix = "", suffix = "", decimals = 0, trend, primary }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className={`surface-card p-5 ${primary ? "surface-glow" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-label">{label}</span>
        {trend && (
          <span className={trend === "up" ? "text-success" : "text-destructive"}>
            {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${primary ? "text-primary" : "text-foreground"}`}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
    </motion.div>
  );
}
