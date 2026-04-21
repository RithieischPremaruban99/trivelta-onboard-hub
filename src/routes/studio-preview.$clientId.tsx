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
import { useEffect, useRef, useState, useCallback } from "react";
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
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";

/* ── Admin email allow-list ─────────────────────────────────────────────── */

const ADMIN_EMAILS = ["rithieisch.premaruban@trivelta.com", "jay@trivelta.com"];

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
  const [studioAccess, setStudioAccess] = useState(false);
  const [studioAccessLocked, setStudioAccessLocked] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Studio · Admin Preview";
  }, []);

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
          .select("name, studio_access, studio_access_locked")
          .eq("id", clientId)
          .maybeSingle(),
        supabase
          .from("onboarding_forms")
          .select("studio_config, studio_locked, studio_locked_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase.from("clients").select("id, name").order("created_at", { ascending: true }),
      ]);

      setClientName(clientRes.data?.name ?? "Client");
      setStudioAccess(clientRes.data?.studio_access ?? false);
      setStudioAccessLocked(clientRes.data?.studio_access_locked ?? false);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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

  const toggleStudioAccess = async () => {
    setTogglingAccess(true);
    const next = !studioAccess;
    const { error } = await supabase
      .from("clients")
      .update(
        next
          ? { studio_access: next, studio_access_granted_at: new Date().toISOString() }
          : { studio_access: next },
      )
      .eq("id", clientId);
    setTogglingAccess(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStudioAccess(next);
    toast.success(next ? "Studio access granted" : "Studio access revoked");
  };

  const toggleStudioLock = async () => {
    setTogglingLock(true);
    const next = !studioAccessLocked;
    const { error } = await supabase
      .from("clients")
      .update({ studio_access_locked: next })
      .eq("id", clientId);
    setTogglingLock(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStudioAccessLocked(next);
    toast.success(next ? "Studio locked for client" : "Studio unlocked for client");
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
  const counter = allClients.length > 0 ? `${currentIndex + 1} / ${allClients.length}` : null;

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
    <AdminPreviewPill
      clientName={clientName}
      counter={counter}
      studioAccess={studioAccess}
      studioAccessLocked={studioAccessLocked}
      togglingAccess={togglingAccess}
      togglingLock={togglingLock}
      clientId={clientId}
      onBack={() => {
        if (window.history.length > 1) window.history.back();
        else navigate({ to: "/admin" });
      }}
      onToggleAccess={toggleStudioAccess}
      onToggleLock={toggleStudioLock}
    >
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

      {/* Studio — full height, no banner offset */}
      <div className="h-screen overflow-hidden">
        <OnboardingCtx.Provider value={ctxValue}>
          <StudioProvider
            initialColors={initialColors}
            initialIcons={initialIcons}
            initialLanguage={initialLanguage}
            initialAppName={initialAppName}
          >
            <StudioInner
              clientId={clientId}
              initialLocked={initialLocked}
              initialLockedAt={initialLockedAt}
            />
          </StudioProvider>
        </OnboardingCtx.Provider>
      </div>
    </AdminPreviewPill>
  );
}

/* ── AdminPreviewPill ─────────────────────────────────────────────────────── */

function AdminPreviewPill({
  clientName,
  counter,
  studioAccess,
  studioAccessLocked,
  togglingAccess,
  togglingLock,
  clientId,
  onBack,
  onToggleAccess,
  onToggleLock,
  children,
}: {
  clientName: string | null;
  counter: string | null;
  studioAccess: boolean;
  studioAccessLocked: boolean;
  togglingAccess: boolean;
  togglingLock: boolean;
  clientId: string;
  onBack: () => void;
  onToggleAccess: () => void;
  onToggleLock: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayName = clientName
    ? clientName.length > 18 ? clientName.slice(0, 18) + "…" : clientName
    : "…";

  return (
    <>
      {/* Compact pill */}
      <div ref={pillRef} className="fixed top-3 left-3 z-[9999]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-amber-400 text-amber-950 shadow-lg px-3 py-1.5 text-[11px] font-semibold transition-all hover:bg-amber-300 active:scale-95"
          title="Admin Preview — click for controls"
        >
          <ShieldCheck className="h-3 w-3 shrink-0" />
          <span>{displayName}</span>
          {counter && <span className="opacity-60 font-normal text-[10px]">{counter}</span>}
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${studioAccess ? "bg-green-700" : "bg-red-700"}`} title={studioAccess ? "Studio: Granted" : "Studio: No Access"} />
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${studioAccessLocked ? "bg-amber-700" : "bg-blue-700"}`} title={studioAccessLocked ? "Design: Locked" : "Design: Unlocked"} />
        </button>

        {/* Popover */}
        {open && (
          <div className="absolute top-full left-0 mt-2 w-[280px] rounded-xl border border-amber-300 bg-amber-50 shadow-xl text-amber-950 text-[12px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-amber-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Preview
              </div>
              <button onClick={() => setOpen(false)} className="rounded p-0.5 hover:bg-amber-200 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Client info */}
            <div className="px-3 py-2 border-b border-amber-200">
              <div className="font-medium truncate">{clientName ?? "Unknown"}</div>
              {counter && <div className="text-[10px] text-amber-700">Client {counter}</div>}
            </div>

            {/* Controls */}
            <div className="px-3 py-2.5 space-y-2">
              {/* Studio Access toggle */}
              <button
                onClick={onToggleAccess}
                disabled={togglingAccess}
                className="flex w-full items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-[11px] font-medium transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                {togglingAccess ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : studioAccess ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-700" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-700" />
                )}
                <span>Studio Access: <strong>{studioAccess ? "Granted" : "No Access"}</strong></span>
                <span className="ml-auto text-amber-600 text-[10px]">toggle</span>
              </button>

              {/* Design Lock toggle */}
              <button
                onClick={onToggleLock}
                disabled={togglingLock || !studioAccess}
                className="flex w-full items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-[11px] font-medium transition-colors hover:bg-amber-100 disabled:opacity-40"
                title={!studioAccess ? "Grant studio access first" : undefined}
              >
                {togglingLock ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : studioAccessLocked ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                )}
                <span>Design: <strong>{studioAccessLocked ? "Locked" : "Unlocked"}</strong></span>
                <span className="ml-auto text-amber-600 text-[10px]">toggle</span>
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 px-3 pb-2.5">
              <button
                onClick={() => { setOpen(false); onBack(); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-amber-100"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Admin
              </button>
              <a
                href={`/onboarding/${clientId}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-amber-100"
              >
                <ExternalLink className="h-3 w-3" />
                Onboarding Form
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Page content */}
      {children}
    </>
  );
}
