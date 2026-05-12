import { useStudio } from "@/contexts/StudioContext";
import { FIELD_LABELS } from "@/lib/tcm-palette";
import { StudioColorField } from "./StudioColorField";
import type { TCMPalette } from "@/lib/tcm-palette";

// Background colors are fixed — the dark skin/layout cannot be changed by clients
const LOCKED_FIELDS = new Set<keyof TCMPalette>([
  "primaryBackgroundColor",
  "dark",
  "darkContainerBackground",
  "modalBackground",
]);

const SECTIONS: { label: string; fields: (keyof TCMPalette)[] }[] = [
  {
    label: "Brand",
    fields: ["primary", "primaryButton", "secondary", "activeSecondaryGradientColor"],
  },
  {
    label: "Backgrounds",
    fields: ["primaryBackgroundColor", "dark", "darkContainerBackground", "modalBackground"],
  },
  {
    label: "Text",
    fields: ["lightTextColor", "textSecondaryColor"],
  },
  {
    label: "Status",
    fields: ["wonColor", "lostColor"],
  },
  {
    label: "Accents",
    fields: ["borderAndGradientBg", "inactiveButtonBg", "inactiveTabUnderline", "boxGradientColorStart", "boxGradientColorEnd"],
  },
];

export function QuickEditPanel() {
  const { locked, setPreviewFocusField } = useStudio();

  return (
    <div className="py-2">
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="px-4 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">
            {section.label}
          </div>
          <div className="space-y-2 px-4">
            {section.fields.map((fieldName) => {
              const isLayoutLocked = LOCKED_FIELDS.has(fieldName);
              return (
                <div
                  key={fieldName}
                  onFocus={() => !isLayoutLocked && setPreviewFocusField(fieldName)}
                  title={isLayoutLocked ? "Fixed — dark layout cannot be changed" : undefined}
                >
                  <StudioColorField
                    fieldName={fieldName}
                    label={
                      isLayoutLocked
                        ? `${FIELD_LABELS[fieldName]} 🔒`
                        : FIELD_LABELS[fieldName]
                    }
                    readOnly={locked || isLayoutLocked}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
