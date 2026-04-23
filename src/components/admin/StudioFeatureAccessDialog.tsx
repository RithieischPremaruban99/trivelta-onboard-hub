import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-log";
import {
  STUDIO_FEATURES,
  STUDIO_FEATURE_LABELS,
  DEFAULT_STUDIO_FEATURES,
  type StudioFeatures,
} from "@/lib/studio-features";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentFeatures: StudioFeatures | null;
  onSaved: (features: StudioFeatures) => void;
}

export function StudioFeatureAccessDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentFeatures,
  onSaved,
}: Props) {
  const [features, setFeatures] = useState<StudioFeatures>(
    currentFeatures ?? DEFAULT_STUDIO_FEATURES,
  );
  const [saving, setSaving] = useState(false);

  // Reset local state when dialog opens with fresh data
  const handleOpenChange = (next: boolean) => {
    if (next) setFeatures(currentFeatures ?? DEFAULT_STUDIO_FEATURES);
    onOpenChange(next);
  };

  const toggle = (feature: keyof StudioFeatures) => {
    if (feature === "landing_page_generator") return; // always on
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("clients")
        .update({ studio_features: features })
        .eq("id", clientId);

      if (error) throw error;

      await logActivity({
        clientId,
        action: "studio_features_updated",
        details: { features },
      });

      onSaved(features);
      onOpenChange(false);
      toast.success("Studio access updated");
    } catch (err) {
      console.error("[StudioFeatureAccessDialog] save failed", err);
      toast.error("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Studio Access — {clientName}</DialogTitle>
          <DialogDescription>
            Select which Studio features this client can access. Changes apply
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {STUDIO_FEATURES.map((feature) => {
            const { label, description } = STUDIO_FEATURE_LABELS[feature];
            const isLocked = feature === "landing_page_generator";
            const enabled = features[feature];

            return (
              <div key={feature} className="flex items-start gap-3">
                <Switch
                  id={`sf-${feature}`}
                  checked={enabled}
                  onCheckedChange={() => toggle(feature)}
                  disabled={isLocked}
                  aria-label={label}
                />
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor={`sf-${feature}`}
                    className="cursor-pointer text-sm font-medium leading-none"
                  >
                    {label}
                    {isLocked && (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground uppercase tracking-wide">
                        Always enabled
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
