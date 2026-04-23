import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_STUDIO_FEATURES,
  type StudioFeatures,
  type StudioFeature,
} from "@/lib/studio-features";
import { useAuth } from "@/lib/auth-context";

export function useStudioFeatures(clientId: string | undefined) {
  const { role } = useAuth();
  const [features, setFeatures] = useState<StudioFeatures>(DEFAULT_STUDIO_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    (async () => {
      // studio_features column added in migration 20260422230000 — cast needed
      // until generated types are regenerated.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("clients")
        .select("studio_features")
        .eq("id", clientId)
        .maybeSingle();

      if (data?.studio_features) {
        setFeatures({
          ...DEFAULT_STUDIO_FEATURES,
          ...(data.studio_features as Partial<StudioFeatures>),
        });
      }
      setLoading(false);
    })();
  }, [clientId]);

  // Trivelta staff bypass — sees all features regardless of client config
  const isStaff =
    role === "admin" || role === "account_executive" || role === "account_manager";

  const hasFeature = (feature: StudioFeature): boolean => {
    if (isStaff) return true;
    return features[feature];
  };

  return { features, hasFeature, isStaff, loading };
}
