import { useStudio } from "@/contexts/StudioContext";
import { QUICK_EDIT_FIELDS, FIELD_LABELS } from "@/lib/tcm-palette";
import { StudioColorField } from "./StudioColorField";
import type { TCMPalette } from "@/lib/tcm-palette";

const SECTIONS: { label: string; fields: (keyof TCMPalette)[] }[] = [
  {
    label: "Brand",
    fields: ["primary", "primaryButton", "primaryButtonGradient", "secondary", "activeSecondaryGradientColor"],
  },
  {
    label: "Backgrounds",
    fields: ["primaryBackgroundColor", "dark", "darkContainerBackground", "modalBackground"],
  },
  {
    label: "Text",
    fields: ["lightTextColor", "textSecondaryColor", "navbarLabel"],
  },
  {
    label: "Status",
    fields: ["wonColor", "lostColor", "payoutWonColor"],
  },
  {
    label: "Accents",
    fields: ["borderAndGradientBg", "inactiveButtonBg", "inactiveTabUnderline", "boxGradientColorStart", "boxGradientColorEnd", "notificationSectionBg"],
  },
];

export function QuickEditPanel() {
  const { locked } = useStudio();

  return (
    <div className="py-2">
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="px-4 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">
            {section.label}
          </div>
          <div className="space-y-2 px-4">
            {section.fields.map((fieldName) => (
              <StudioColorField
                key={fieldName}
                fieldName={fieldName}
                label={FIELD_LABELS[fieldName]}
                readOnly={locked}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
