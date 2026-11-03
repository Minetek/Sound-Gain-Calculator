import { CURRENCIES, type CurrencyConfig } from "@/lib/currency";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const FLAG_URLS: Record<string, string> = {
  USD: "https://flagcdn.com/w40/us.png",
  AUD: "https://flagcdn.com/w40/au.png",
  CAD: "https://flagcdn.com/w40/ca.png",
  EUR: "https://flagcdn.com/w40/eu.png",
  GBP: "https://flagcdn.com/w40/gb.png",
};

interface CurrencySelectorProps {
  value: CurrencyConfig;
  onChange: (currency: CurrencyConfig) => void;
}

function FlagIcon({ code }: { code: string }) {
  return <img src={FLAG_URLS[code]} alt={code} className="w-5 h-3.5 rounded-[2px] object-cover shrink-0" />;
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <Select value={value.code} onValueChange={(code) => { const c = CURRENCIES.find((c) => c.code === code); if (c) onChange(c); }}>
      <SelectTrigger className="w-[115px] h-8 bg-secondary/50 border-none text-xs font-medium rounded-lg">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <FlagIcon code={value.code} />
            <span>{value.symbol} {value.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code} className="text-xs">
            <span className="flex items-center gap-2">
              <FlagIcon code={c.code} />
              <span>{c.symbol} {c.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
