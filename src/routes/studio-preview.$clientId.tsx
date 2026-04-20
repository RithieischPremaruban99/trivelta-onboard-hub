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
 *
 * Prev/next navigation arrows let admins scroll through all clients without
 * returning to the dashboard. ArrowLeft/ArrowRight keyboard shortcuts work too.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  StudioProvider,
  defaultStudioColors,
  defaultStudioAppIcons,
  type StudioThemeColors,
  type StudioAppIcons,
  type StudioSavedConfig,
  type Language,
} from "@/contexts/StudioContext";
import { OnboardingCtx, type OnboardingCtxValue } from "@/lib/onboarding-context";
import { StudioInner } from "@/routes/onboarding.$clientId.studio";
import { Loader2, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Admin email allow-list ─────────────────────────────────────────────── */

const ADMIN_EMAILS = [
  "rithieisch.premaruban@trivelta.com",
  "jay@trivelta.com",
];

export const Route = createFileRoute("/studio-preview/$clientId")({
  component: StudioPreviewPage,
});

/* ── Client list entry ───────────────────────────────────────────────────── */

interface ClientLite {
  id: string;
  name: string;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

function StudioPreviewPage() {
  const { clientId } = useParams({ from: "/studio-preview/$clientId" });
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState<string | null>(null);
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLanguage, setInitialLanguage] = useState<Language | undefined>(undefined);
  const [initialAppName, setInitialAppName] = useState<string | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // All clients for prev/next navigation
  const [allClients, setAllClients] = useState<ClientLite[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Tooltip hover state for arrow buttons
  const [hoveredArrow, setHoveredArrow] = useState<"prev" | "next" | null>(null);

  const isAdmin = role === "admin" || ADMIN_EMAILS.includes(user?.email ?? "");

  // Keep a ref to navigate so the keyboard handler never goes stale
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

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
      const [clientRes, formRes, allClientsRes] = await Promise.all([
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
        supabase
          .from("clients")
          .select("id, name")
          .order("created_at", { ascending: true }),
      ]);

      setClientName(clientRes.data?.name ?? "Client");

      const clients = (allClientsRes.data ?? []) as ClientLite[];
      setAllClients(clients);
      setCurrentIndex(clients.findIndex((c) => c.id === clientId));

      const data = formRes.data;
      if (data?.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;
        if (saved.colors) {
          setInitialColors({ ...defaultStudioColors, ...saved.colors });
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else {
          setInitialColors({
            ...defaultStudioColors,
            ...(data.studio_config as Partial<StudioThemeColors>),
          });
        }
        if (saved.language) setInitialLanguage(saved.language);
        if (saved.appName) setInitialAppName(saved.appName);
      }

      if (data?.studio_locked) {
        setInitialLocked(true);
        setInitialLockedAt(data.studio_locked_at ?? null);
      }

      setReady(true);
    })();
  }, [authLoading, user, clientId, isAdmin]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        navigateRef.current({
          to: "/studio-preview/$clientId",
          params: { clientId: allClients[currentIndex - 1].id },
        });
      }
      if (e.key === "ArrowRight" && currentIndex < allClients.length - 1) {
        navigateRef.current({
          to: "/studio-preview/$clientId",
          params: { clientId: allClients[currentIndex + 1].id },
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, allClients]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      navigate({
        to: "/studio-preview/$clientId",
        params: { clientId: allClients[currentIndex - 1].id },
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < allClients.length - 1) {
      navigate({
        to: "/studio-preview/$clientId",
        params: { clientId: allClients[currentIndex + 1].id },
      });
    }
  };

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

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allClients.length - 1;
  const prevClient = hasPrev ? allClients[currentIndex - 1] : null;
  const nextClient = hasNext ? allClients[currentIndex + 1] : null;
  const counter =
    allClients.length > 0 ? `${currentIndex + 1} / ${allClients.length}` : null;

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
          Admin Preview Mode —{" "}
          <span className="max-w-[260px] truncate">{clientName ?? "…"}</span>
          {counter && (
            <span className="opacity-60 font-normal">({counter})</span>
          )}
        </div>

        {/* Spacer mirrors the back button width to keep label centered */}
        <div className="w-[110px]" />
      </div>

      {/* Prev arrow */}
      <button
        onClick={goToPrev}
        disabled={!hasPrev}
        onMouseEnter={() => setHoveredArrow("prev")}
        onMouseLeave={() => setHoveredArrow(null)}
        className="fixed left-2 top-1/2 -translate-y-1/2 z-[9998] flex items-center justify-center h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Previous client"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Prev tooltip */}
      {hoveredArrow === "prev" && prevClient && (
        <div className="fixed left-14 top-1/2 -translate-y-1/2 z-[9998] pointer-events-none">
          <div className="bg-black/80 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap max-w-[180px] truncate shadow-lg">
            ← {prevClient.name}
          </div>
        </div>
      )}

      {/* Next arrow */}
      <button
        onClick={goToNext}
        disabled={!hasNext}
        onMouseEnter={() => setHoveredArrow("next")}
        onMouseLeave={() => setHoveredArrow(null)}
        className="fixed right-2 top-1/2 -translate-y-1/2 z-[9998] flex items-center justify-center h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Next client"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Next tooltip */}
      {hoveredArrow === "next" && nextClient && (
        <div className="fixed right-14 top-1/2 -translate-y-1/2 z-[9998] pointer-events-none">
          <div className="bg-black/80 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap max-w-[180px] truncate shadow-lg">
            {nextClient.name} →
          </div>
        </div>
      )}

      {/* Push content below the banner */}
      <div className="pt-8 h-screen overflow-hidden">
        <OnboardingCtx.Provider value={ctxValue}>
          <StudioProvider initialColors={initialColors} initialIcons={initialIcons} initialLanguage={initialLanguage} initialAppName={initialAppName}>
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
