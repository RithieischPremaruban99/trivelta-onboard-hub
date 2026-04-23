import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PremiumColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const PRESET_PALETTES = [
  { name: "iGaming Gold", colors: ["#FFD700", "#FFA500", "#FF8C00"] },
  { name: "Royal Purple", colors: ["#9818EB", "#6D28D9", "#4C1D95"] },
  { name: "Ocean Blue", colors: ["#3B82F6", "#2563EB", "#1D4ED8"] },
  { name: "Emerald", colors: ["#10B981", "#059669", "#047857"] },
  { name: "Ruby Red", colors: ["#EF4444", "#DC2626", "#B91C1C"] },
  { name: "Vibrant Orange", colors: ["#F97316", "#EA580C", "#C2410C"] },
  { name: "Hot Pink", colors: ["#EC4899", "#DB2777", "#BE185D"] },
  { name: "Premium Black", colors: ["#1F2937", "#111827", "#030712"] },
];

export function PremiumColorPicker({
  label,
  value,
  onChange,
  required,
  disabled,
}: PremiumColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5 group">
      <label
        className={cn(
          "text-[11px] uppercase tracking-wider font-semibold transition-colors duration-200",
          "text-muted-foreground group-focus-within:text-primary",
        )}
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>

      <Popover open={open && !disabled} onOpenChange={(v) => !disabled && setOpen(v)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl",
              "border border-border/40 hover:border-primary/40",
              "bg-background/40 hover:bg-background/60",
              "transition-all duration-200 group/trigger",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <div
              className="h-10 w-10 rounded-lg shadow-md ring-1 ring-white/10 transition-transform group-hover/trigger:scale-105 shrink-0"
              style={{ background: value }}
            />
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium font-mono">{value.toUpperCase()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Click to change
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-all duration-200 shrink-0",
                "group-hover/trigger:text-primary",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="start" sideOffset={8}>
          <div className="space-y-4">
            {/* Current + custom input */}
            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-xl shadow-lg ring-1 ring-white/10 shrink-0"
                style={{ background: value }}
              />
              <div className="flex-1 space-y-1.5 min-w-0">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Hex Value
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    maxLength={7}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 text-sm font-mono rounded-md bg-background border border-border/40 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-10 rounded-md cursor-pointer border border-border/40 bg-transparent p-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* Preset palettes */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                iGaming presets
              </div>
              <div className="space-y-2">
                {PRESET_PALETTES.map((palette) => (
                  <div key={palette.name} className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">{palette.name}</div>
                    <div className="flex gap-1.5">
                      {palette.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            onChange(color);
                            setOpen(false);
                          }}
                          title={color}
                          className={cn(
                            "h-8 w-8 rounded-lg shadow-sm ring-1 ring-white/10",
                            "hover:scale-110 hover:ring-2 hover:ring-primary/50",
                            "transition-all duration-200",
                            value.toUpperCase() === color.toUpperCase() &&
                              "ring-2 ring-primary scale-110",
                          )}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
