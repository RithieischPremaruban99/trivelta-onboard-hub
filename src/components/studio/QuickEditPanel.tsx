import { useStudio } from "@/contexts/StudioContext";
import { QUICK_EDIT_FIELDS, FIELD_LABELS } from "@/lib/tcm-palette";
import { StudioColorField } from "./StudioColorField";

export function QuickEditPanel() {
  const { locked } = useStudio();

  return (
    <div className="space-y-2 px-4 py-3">
      {QUICK_EDIT_FIELDS.map((fieldName) => (
        <StudioColorField
          key={fieldName}
          fieldName={fieldName}
          label={FIELD_LABELS[fieldName]}
          readOnly={locked}
        />
      ))}
    </div>
  );
}
