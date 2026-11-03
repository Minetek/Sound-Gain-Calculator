import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, className = "" }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 600;
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={Math.round(value)}
        initial={{ opacity: 0.7, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-metric ${className}`}
      >
        {prefix}{formatted}{suffix}
      </motion.span>
    </AnimatePresence>
  );
}
