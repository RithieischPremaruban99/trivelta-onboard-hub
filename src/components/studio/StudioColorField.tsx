import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { type TCMPalette } from "@/lib/tcm-palette";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "#000000";
  return (
    "#" +
    [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("")
  );
}

function extractAlpha(rgba: string): number {
  const m = rgba.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function StudioColorField({
  fieldName,
  label,
  compact = false,
  readOnly = false,
}: {
  fieldName: keyof TCMPalette;
  label: string;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const { palette, updatePaletteField, isOverridden, resetPaletteField, locked } = useStudio();
  const effectiveReadOnly = readOnly || locked;
  const rgba = palette[fieldName];
  const alpha = extractAlpha(rgba);
  const [hexInput, setHexInput] = useState(() => rgbaToHex(rgba));
  const overridden = isOverridden(fieldName);

  useEffect(() => {
    setHexInput(rgbaToHex(rgba));
  }, [rgba]);

  const applyHex = (v: string) => {
    if (effectiveReadOnly) return;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      updatePaletteField(fieldName, hexToRgba(v, alpha));
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        effectiveReadOnly && "pointer-events-none opacity-50",
      )}
    >
      <label
        className={cn(
          "relative shrink-0",
          effectiveReadOnly ? "cursor-default" : "cursor-pointer",
        )}
      >
        <div
          className={cn(
            "rounded-md border border-border/60 shadow-sm",
            compact ? "h-7 w-7" : "h-8 w-8",
          )}
          style={{ background: rgba }}
        />
        <input
          type="color"
          value={rgbaToHex(rgba)}
          disabled={effectiveReadOnly}
          onChange={(e) => {
            setHexInput(e.target.value);
            updatePaletteField(fieldName, hexToRgba(e.target.value, alpha));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </label>

      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="mb-0.5 text-[10px] leading-none text-muted-foreground">{label}</div>
        )}
        <Input
          value={hexInput}
          readOnly={effectiveReadOnly}
          onChange={(e) => {
            setHexInput(e.target.value);
            applyHex(e.target.value);
          }}
          onBlur={() => setHexInput(rgbaToHex(rgba))}
          className={cn(
            "font-mono",
            compact ? "h-7 text-[10px]" : "h-7 text-[11px]",
            overridden && !effectiveReadOnly && "ring-1 ring-primary/40",
          )}
          placeholder="#000000"
          maxLength={7}
          title={label}
        />
      </div>

      {overridden && !effectiveReadOnly && (
        <button
          type="button"
          onClick={() => resetPaletteField(fieldName)}
          title="Reset to AI value"
          className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-primary"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
