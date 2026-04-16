import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RentFrequencyToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
  className?: string;
}

export function RentFrequencyToggle({
  isYearly,
  onToggle,
  className = "",
}: RentFrequencyToggleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Label
        htmlFor="rent-frequency-toggle"
        className={`text-sm transition-colors ${
          !isYearly ? "text-slate-900 font-medium" : "text-slate-500"
        }`}
      >
        Monthly
      </Label>
      <Switch
        id="rent-frequency-toggle"
        checked={isYearly}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-orange-500"
      />
      <Label
        htmlFor="rent-frequency-toggle"
        className={`text-sm transition-colors ${
          isYearly ? "text-slate-900 font-medium" : "text-slate-500"
        }`}
      >
        Yearly
      </Label>
    </div>
  );
}
