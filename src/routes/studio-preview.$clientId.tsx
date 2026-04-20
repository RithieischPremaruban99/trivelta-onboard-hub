/**
 * Studio Preview Route — /studio-preview/:clientId
 *
 * Admin-only route that opens Studio directly for any client, bypassing all
 * normal access gates (studio_access_locked, onboarding submission check,
 * client_owner check). Useful for QA, demos, and design reviews.
 *
 * Access is restricted to users with admin role OR the two designated admin
 * emails. All other authenticated users are redirected to /admin; unauthenticated
 * users are redirected to /login.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  StudioProvider,
  defaultStudioColors,
  defaultStudioAppIcons,
  type StudioThemeColors,
  type StudioAppIcons,
  type StudioSavedConfig,
} from "@/contexts/StudioContext";
import { OnboardingCtx, type OnboardingCtxValue } from "@/lib/onboarding-context";
import { StudioInner } from "@/routes/onboarding.$clientId.studio";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

/* ── Admin email allow-list ─────────────────────────────────────────────── */

const ADMIN_EMAILS = [
  "rithieisch.premaruban@trivelta.com",
  "jay@trivelta.com",
];

export const Route = createFileRoute("/studio-preview/$clientId")({
  component: StudioPreviewPage,
});

/* ── Page ────────────────────────────────────────────────────────────────── */

function StudioPreviewPage() {
  const { clientId } = useParams({ from: "/studio-preview/$clientId" });
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState<string | null>(null);
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const isAdmin =
    role === "admin" || ADMIN_EMAILS.includes(user?.email ?? "");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (!isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }

    (async () => {
      const [clientRes, formRes] = await Promise.all([
        supabase
          .from("clients")
          .select("name")
          .eq("id", clientId)
          .maybeSingle(),
        supabase
          .from("onboarding_forms")
          .select("studio_config, studio_locked, studio_locked_at")
          .eq("client_id", clientId)
          .maybeSingle(),
      ]);

      setClientName(clientRes.data?.name ?? "Client");

      const data = formRes.data;
      if (data?.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;
        if (saved.colors) {
          setInitialColors({ ...defaultStudioColors, ...saved.colors });
          setInitialIcons({
            ...defaultStudioAppIcons,
            ...(saved.icons ?? {}),
          });
        } else {
          setInitialColors({
            ...defaultStudioColors,
            ...(data.studio_config as Partial<StudioThemeColors>),
          });
        }
      }

      if (data?.studio_locked) {
        setInitialLocked(true);
        setInitialLockedAt(data.studio_locked_at ?? null);
      }

      setReady(true);
    })();
  }, [authLoading, user, clientId, isAdmin]);

  /* Loading */
  if (authLoading || !ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  /* Not admin — should have been redirected above, but guard here too */
  if (!isAdmin) {
    navigate({ to: "/admin", replace: true });
    return null;
  }

  /* Provide OnboardingCtx directly — no visitor registration, no side effects */
  const ctxValue: OnboardingCtxValue = {
    clientId,
    welcomeInfo: {
      clientName: clientName ?? "Client",
      driveLink: null,
      amName: null,
      amEmail: null,
    },
    clientRole: null,
    ownerEmail: null,
    loadingPublic: false,
    loadingAuth: false,
  };

  return (
    <>
      {/* Admin banner */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-8 flex items-center justify-between px-4 bg-amber-400 text-amber-950 text-[12px] font-semibold shadow-sm">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: "/admin" });
            }
          }}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-amber-500/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Admin
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Preview Mode — {clientName ?? "…"}
        </div>

        {/* Spacer to keep the label centered */}
        <div className="w-[110px]" />
      </div>

      {/* Push content below the banner */}
      <div className="pt-8 h-screen overflow-hidden">
        <OnboardingCtx.Provider value={ctxValue}>
          <StudioProvider
            initialColors={initialColors}
            initialIcons={initialIcons}
          >
            <StudioInner
              clientId={clientId}
              initialLocked={initialLocked}
              initialLockedAt={initialLockedAt}
            />
          </StudioProvider>
        </OnboardingCtx.Provider>
      </div>
    </>
  );
}
