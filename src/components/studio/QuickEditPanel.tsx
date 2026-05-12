import { useStudio } from "@/contexts/StudioContext";
import { FIELD_LABELS } from "@/lib/tcm-palette";
import { StudioColorField } from "./StudioColorField";
import type { TCMPalette } from "@/lib/tcm-palette";

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
            {section.fields.map((fieldName) => (
              <div
                key={fieldName}
                onFocus={() => setPreviewFocusField(fieldName)}
              >
                <StudioColorField
                  fieldName={fieldName}
                  label={FIELD_LABELS[fieldName]}
                  readOnly={locked}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
