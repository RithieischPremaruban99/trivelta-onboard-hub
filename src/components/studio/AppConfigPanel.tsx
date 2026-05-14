import { useStudio } from "@/contexts/StudioContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "./FormField";

const KMK_CLIENT_ID = "8e1aee03-7a76-4ad8-a336-6a8a1dae9fc0";

const CURRENCY_PRESETS: { value: string; label: string }[] = [
  { value: "₦", label: "₦  Nigerian Naira" },
  { value: "GH₵", label: "GH₵  Ghanaian Cedi" },
  { value: "KES", label: "KES  Kenyan Shilling" },
  { value: "MXN", label: "MXN  Mexican Peso" },
  { value: "BRL", label: "BRL  Brazilian Real" },
  { value: "EUR", label: "EUR  Euro" },
  { value: "USD", label: "USD  US Dollar" },
  { value: "ZAR", label: "ZAR  South African Rand" },
];

const HEADLINE_MAX = 60;
const DESCRIPTION_MAX = 80;

export function AppConfigPanel({ clientId }: { clientId?: string }) {
  const { appLabels, setAppLabels, locked } = useStudio();
  const isKmk = clientId === KMK_CLIENT_ID;

  const currencyValue = appLabels.currencySymbol ?? "₦";
  const isPreset = CURRENCY_PRESETS.some((p) => p.value === currencyValue);
  const selectValue = isPreset ? currencyValue : "__custom__";

  const currencyReadOnly = locked || isKmk;

  return (
    <div className="space-y-4 px-4 py-3">
      <FormField label="Currency" helperText={isKmk ? "Locked for this client" : undefined}>
        <Select
          value={selectValue}
          disabled={currencyReadOnly}
          onValueChange={(v) => {
            if (v === "__custom__") {
              setAppLabels((prev) => ({ ...prev, currencySymbol: "" }));
            } else {
              setAppLabels((prev) => ({ ...prev, currencySymbol: v }));
            }
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value="__custom__" className="text-xs">
              Custom…
            </SelectItem>
          </SelectContent>
        </Select>
        {!isPreset && (
          <Input
            value={currencyValue}
            readOnly={currencyReadOnly}
            placeholder="Enter symbol (e.g. £)"
            maxLength={6}
            onChange={(e) =>
              setAppLabels((prev) => ({ ...prev, currencySymbol: e.target.value }))
            }
            className="mt-2 h-8 text-xs"
          />
        )}
      </FormField>

      <FormField
        label="Welcome Offer"
        helperText={`${(appLabels.welcomeBonusHeadline ?? "").length}/${HEADLINE_MAX}`}
      >
        <Input
          value={appLabels.welcomeBonusHeadline ?? ""}
          readOnly={locked}
          placeholder="GET A 100% BONUS ON YOUR FIRST DEPOSIT"
          maxLength={HEADLINE_MAX}
          onChange={(e) =>
            setAppLabels((prev) => ({ ...prev, welcomeBonusHeadline: e.target.value }))
          }
          className="h-8 text-xs"
        />
      </FormField>

      <FormField
        label="Offer Description"
        helperText={`${(appLabels.welcomeBonusDescription ?? "").length}/${DESCRIPTION_MAX}`}
      >
        <Input
          value={appLabels.welcomeBonusDescription ?? ""}
          readOnly={locked}
          placeholder="Enjoy 100% on your first deposit..."
          maxLength={DESCRIPTION_MAX}
          onChange={(e) =>
            setAppLabels((prev) => ({ ...prev, welcomeBonusDescription: e.target.value }))
          }
          className="h-8 text-xs"
        />
      </FormField>
    </div>
  );
}
