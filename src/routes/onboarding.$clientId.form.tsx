import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/form/FieldInfo";
import { OtherIntegrationDisclaimer } from "@/components/form/OtherIntegrationDisclaimer";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  COUNTRIES,
  countRequiredFields,
  emptyForm,
  isFormComplete,
  validators,
  type ContactBlock,
  type FormShape,
} from "@/lib/onboarding-schema";
import {
  Loader2,
  CheckCircle2,
  Send,
  Upload,
  Phone,
  Palette,
  ScrollText,
  Plug,
  ExternalLink,
  Info,
  AlertTriangle,
  Lock,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Eye,
  ArrowRight,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TriveltaNav } from "@/components/TriveltaNav";
import { logActivity } from "@/lib/activity-log";
import { OnboardingLoadingScreen } from "@/components/onboarding/OnboardingLoadingScreen";
import { ActiveLandingPageCard } from "@/components/onboarding/ActiveLandingPageCard";
import { ActiveFullStudioCard } from "@/components/onboarding/ActiveFullStudioCard";
import { LockedFullStudioTeaser } from "@/components/onboarding/LockedFullStudioTeaser";
import { PaymentProviderSelect } from "@/components/onboarding/PaymentProviderSelect";

/* ─── Per-section field progress ─────────────────────────────── */

function sectionFieldStats(id: string, f: FormShape): { filled: number; total: number } {
  switch (id) {
    case "1": {
      const checks = [
        !!f.contact_sportsbook.name,
        !!f.contact_sportsbook.email,
        !!f.contact_sportsbook.phone,
        !!f.contact_operational.name,
        !!f.contact_operational.email,
        !!f.contact_operational.phone,
        !!f.contact_compliance.name,
        !!f.contact_compliance.email,
        !!f.contact_compliance.phone,
      ];
      return { filled: checks.filter(Boolean).length, total: 9 };
    }
    case "2": {
      const checks = [f.asset_company_logo, f.asset_app_name_logo, f.asset_top_left_icon];
      return { filled: checks.filter(Boolean).length, total: 3 };
    }
    case "3": {
      const checks = [!!f.platform_url, !!f.country, !!f.dns_provider, !!f.dns_access];
      return { filled: checks.filter(Boolean).length, total: checks.length };
    }
    case "4": {
      const needsLP = f.landing_page === "yes";
      const checks = [
        !!f.footer_required,
        !!f.landing_page,
        !!f.terms_url,
        !!f.privacy_url,
        !!f.rg_url,
        ...(needsLP ? [!!f.landing_page_url] : []),
      ];
      return { filled: checks.filter(Boolean).length, total: checks.length };
    }
    case "5": {
      const pspOk = f.payment_providers.length > 0;
      const checks = [pspOk, !!f.kyc_surt, !!f.duns_status, !!f.zendesk];
      return { filled: checks.filter(Boolean).length, total: 4 };
    }
    default:
      return { filled: 0, total: 0 };
  }
}

/* ─── Presence types & helpers ───────────────────────────────── */

interface PresencePayload {
  user_email: string;
  name: string;
  current_section: string;
  last_active: string; // ISO string
}

interface PresenceUser extends PresencePayload {
  color: string;
  initials: string;
}

const PRESENCE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

const SECTION_LABELS: Record<string, string> = {
  "1": "Team Contacts",
  "2": "Media & Branding",
  "3": "Platform Setup",
  "4": "Legal & Policies",
  "5": "3rd Party",
};

function presenceColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}

function presenceInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function emailToName(email: string): string {
  const local = email.split("@")[0];
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseOtherUsers(raw: Record<string, unknown[]>, myEmail: string): PresenceUser[] {
  const cutoff = Date.now() - 2 * 60 * 1000;
  const users: PresenceUser[] = [];
  for (const [key, presences] of Object.entries(raw)) {
    if (key === myEmail) continue;
    const p = presences[0] as PresencePayload | undefined;
    if (!p) continue;
    if (new Date(p.last_active).getTime() < cutoff) continue;
    users.push({
      ...p,
      color: presenceColor(p.user_email),
      initials: presenceInitials(p.name),
    });
  }
  return users;
}

function PresenceAvatars({ users }: { users: PresenceUser[] }) {
  if (!users.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {users.slice(0, 4).map((u) => {
          const isActive = Date.now() - new Date(u.last_active).getTime() < 30_000;
          return (
            <div
              key={u.user_email}
              className="relative group"
              title={`${u.name} - Section ${SECTION_LABELS[u.current_section] ?? u.current_section}`}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background ring-1 ring-black/10"
                style={{ backgroundColor: u.color }}
              >
                {u.initials}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${isActive ? "bg-success" : "bg-muted-foreground"}`}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-9 right-0 hidden group-hover:flex flex-col items-end z-50">
                <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground shadow-lg whitespace-nowrap">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-muted-foreground">
                    {SECTION_LABELS[u.current_section] ?? `Section ${u.current_section}`}
                  </div>
                </div>
                <div
                  className="w-2 h-1 bg-card border-b border-r border-border"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {users.length > 4 && (
        <span className="text-[11px] text-muted-foreground">+{users.length - 4} more</span>
      )}
    </div>
  );
}

export const Route = createFileRoute("/onboarding/$clientId/form")({
  component: FormScreen,
});

/* ─── Save status indicator ───────────────────────────────────── */

function SaveStatus({
  status,
  lastSaved,
  onRetry,
}: {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  onRetry: () => void;
}) {
  if (status === "idle") return null;
  if (status === "saving")
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-background border px-3 py-1.5 text-sm shadow-sm">
        <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
        Saving...
      </div>
    );
  if (status === "saved")
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-background border px-3 py-1.5 text-sm shadow-sm text-green-600">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        Saved{" "}
        {lastSaved
          ? `${Math.round((Date.now() - lastSaved.getTime()) / 1000)}s ago`
          : ""}
      </div>
    );
  if (status === "error")
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-background border border-red-200 px-3 py-1.5 text-sm shadow-sm text-red-600">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        Couldn't save —{" "}
        <button onClick={onRetry} className="underline">
          retry
        </button>
      </div>
    );
  return null;
}

function FormScreen() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/form" });
  const { welcomeInfo, clientRole, ownerEmail, loadingPublic, loadingAuth } = useOnboardingCtx();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormShape>(emptyForm());
  const [open, setOpen] = useState<string[]>(["1"]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isRemoteUpdate = useRef(false);

  // Auto-save wiring: build a react-hook-form-compatible watch adapter
  // from plain useState so useFormAutoSave can subscribe to form changes.
  const autoSaveSubscriberRef = useRef<((value: Record<string, unknown>) => void) | null>(null);
  const watchAdapter = useCallback(
    (cb: (value: Record<string, unknown>) => void) => {
      autoSaveSubscriberRef.current = cb;
      return { unsubscribe: () => { autoSaveSubscriberRef.current = null; } };
    },
    [],
  );
  // Mark the `data` column as dirty — the facade maps this to an upsert
  const dirtyFieldsAdapter: Record<string, unknown> = { data: true };
  const [studioAccess, setStudioAccess] = useState(false);
  const studioAccessRef = useRef(false);

  // Auto-save hook — drives the save status indicator.
  // onboarding_forms uses a `data` JSON column + client_id key (not id),
  // so we pass the whole form as { data: form } and query by client_id via
  // a tiny supabase proxy that wraps the upsert in place of a plain update.
  // The hook's generic .update().eq("id", …) path is replaced by injecting
  // a supabase facade below that routes to the correct upsert call.
  // Thin facade so useFormAutoSave can drive status tracking.
  // The actual upsert maps to onboarding_forms(data) via client_id, not id.
  const supabaseFacade = {
    from: (_table: string) => ({
      update: (data: Record<string, unknown>) => ({
        eq: (_col: string, _val: string) =>
          supabase
            .from("onboarding_forms")
            .upsert([{ client_id: clientId, ...data } as never], {
              onConflict: "client_id",
            }),
      }),
    }),
  } as unknown as typeof supabase;

  const { status: saveStatus, lastSaved: autoSavedAt } = useFormAutoSave({
    prospectId: clientId,
    watch: watchAdapter,
    dirtyFields: dirtyFieldsAdapter,
    supabase: supabaseFacade,
    table: "onboarding_forms",
    delay: 800,
  });

  // Presence
  const [otherUsers, setOtherUsers] = useState<PresenceUser[]>([]);
  const [currentSection, setCurrentSection] = useState("1");
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myPresenceRef = useRef<PresencePayload | null>(null);

  useEffect(() => {
    document.title = "Trivelta Hub · Onboarding";
  }, []);

  // Redirect unauthenticated users to auth screen
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
    }
  }, [user, authLoading]);

  // Load existing form data
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      setLoading(true);
      try {
        const [formRes, clientRes] = await Promise.all([
          supabase
            .from("onboarding_forms")
            .select("data, submitted_at")
            .eq("client_id", clientId)
            .maybeSingle(),
          supabase
            .from("clients")
            .select("studio_access, studio_features")
            .eq("id", clientId)
            .maybeSingle(),
        ]);
        if (formRes.error) throw formRes.error;

        // Guard: client doesn't exist — stale URL or deleted client
        if (!clientRes.data) {
          toast.error("This onboarding session is no longer valid. Please contact your account manager.");
          setLoading(false);
          return;
        }

        // Ensure the onboarding_forms row exists so every auto-save is an
        // UPDATE (onConflict path) rather than an INSERT — prevents FK violations.
        if (!formRes.data) {
          await supabase
            .from("onboarding_forms")
            .upsert({ client_id: clientId, data: {} }, { onConflict: "client_id" });
        }

        const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
        const hasStudioAccessFlag = clientRes.data?.studio_access ?? false;
        const hasLandingPageGen = sf?.landing_page_generator === true;

        // Full-Studio features (excludes landing_page_generator which has its own flow)
        const hasAnyFullStudioFeature = (
          [sf?.ai_chat, sf?.color_editor, sf?.animation_tools, sf?.logo_editor, sf?.asset_library]
            .some((v) => v === true)
        );

        // CTA visibility: landing_page_generator alone does NOT unlock the full Studio CTA
        // (344 color fields, AI logo, etc. — features the client doesn't actually have)
        const canSeeStudioAdvertising = hasStudioAccessFlag || hasAnyFullStudioFeature;

        // Post-load routing: landing_page_generator clients DO go to /studio (landing-only mode)
        const routeToStudio = hasStudioAccessFlag || hasLandingPageGen || hasAnyFullStudioFeature;

        setStudioAccess(canSeeStudioAdvertising);
        studioAccessRef.current = routeToStudio;
        if (formRes.data?.data) setForm(emptyForm(formRes.data.data as Partial<FormShape>));
        if (formRes.data?.submitted_at) {
          setSubmitted(formRes.data.submitted_at);
          navigate({ to: "/onboarding/$clientId/success", params: { clientId }, replace: true });
          return;
        }
        // Not submitted - redirect to welcome on first visit
        let seenWelcome = false;
        try {
          seenWelcome = localStorage.getItem(`client-welcome-seen-${clientId}`) === "1";
        } catch {
          seenWelcome = true;
        }
        if (!seenWelcome) {
          navigate({ to: "/onboarding/$clientId/welcome", params: { clientId }, replace: true });
          return; // stay loading - component unmounts on navigation, no form flash
        }
        // All routing checks passed - user should see the form
        setLoading(false);
      } catch (err) {
        console.error("[Form] Failed to load form data:", err);
        toast.error("Could not load your form. Please refresh.");
        setLoading(false);
      }
    })();
  }, [clientId, user, authLoading]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`form:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "onboarding_forms",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const remote = payload.new as { data: Partial<FormShape>; submitted_at: string | null };
          isRemoteUpdate.current = true;
          setForm(emptyForm(remote.data));
          if (remote.submitted_at) {
            setSubmitted(remote.submitted_at);
            navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clientId]);

  // Notify the auto-save subscriber whenever form changes (feeds useFormAutoSave status)
  useEffect(() => {
    if (!user || submitted) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    // Pass { data: form } so the facade upserts into the data JSON column
    autoSaveSubscriberRef.current?.({ data: form as unknown });
  }, [form, user, submitted]);

  // Presence: join channel
  useEffect(() => {
    if (!user) return;
    const myEmail = user.email ?? "";
    const myName = emailToName(myEmail);
    const initial: PresencePayload = {
      user_email: myEmail,
      name: myName,
      current_section: "1",
      last_active: new Date().toISOString(),
    };
    myPresenceRef.current = initial;
    const ch = supabase.channel(`onboarding-form:${clientId}`, {
      config: { presence: { key: myEmail } },
    });
    ch.on("presence", { event: "sync" }, () => {
      setOtherUsers(parseOtherUsers(ch.presenceState<PresencePayload>(), myEmail));
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track(myPresenceRef.current!);
      }
    });
    presenceChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      presenceChannelRef.current = null;
    };
  }, [user, clientId]);

  // Presence: heartbeat on form changes (debounced 800ms)
  useEffect(() => {
    if (!user || !myPresenceRef.current) return;
    const t = setTimeout(async () => {
      const updated: PresencePayload = {
        ...myPresenceRef.current!,
        last_active: new Date().toISOString(),
      };
      myPresenceRef.current = updated;
      await presenceChannelRef.current?.track(updated);
    }, 800);
    return () => clearTimeout(t);
  }, [form, user]);

  const sectionDone = useMemo(
    () => Object.fromEntries([1, 2, 3, 4, 5].map((n) => [String(n), validators[n](form)])),
    [form],
  );

  const { filled, total } = useMemo(() => countRequiredFields(form), [form]);
  const completion = useMemo(() => Math.round((filled / total) * 100), [filled, total]);
  const isOwner = clientRole === "client_owner";
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [shakeErrors, setShakeErrors] = useState(false);

  const update = <K extends keyof FormShape>(key: K, value: FormShape[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const updateContact = (
    key: "contact_sportsbook" | "contact_operational" | "contact_compliance",
    field: keyof ContactBlock,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: { ...f[key], [field]: value } }));

  const handleSectionToggle = async (next: string[]) => {
    setOpen(next);
    const added = next.find((id) => !open.includes(id));
    if (!added) return;
    setCurrentSection(added);
    if (myPresenceRef.current && presenceChannelRef.current) {
      const updated: PresencePayload = {
        ...myPresenceRef.current,
        current_section: added,
        last_active: new Date().toISOString(),
      };
      myPresenceRef.current = updated;
      await presenceChannelRef.current.track(updated);
    }
  };

  const executeSubmit = async () => {
    if (!isFormComplete(form) || !isOwner) return;
    setSubmitting(true);

    // 1. Submit via RPC - enforces ownership, marks submitted_at, and writes
    //    an immutable audit record to onboarding_submissions.
    //    The log_form_submission trigger also writes form_submissions.
    const { error } = await supabase.from("onboarding_forms").upsert(
      {
        client_id: clientId,
        data: form as never,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    );
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // 2. Create Notion page + SOP checklist (fire-and-forget - don't block navigation)
    if (welcomeInfo) {
      const psps: string[] = form.payment_providers;
      supabase.functions.invoke("handle-submission", {
        body: {
          client_id: clientId,
          client_name: welcomeInfo.clientName,
          drive_link: welcomeInfo.driveLink ?? null,
          am_name: welcomeInfo.amName ?? null,
          am_email: welcomeInfo.amEmail ?? null,
          sportsbook_name: form.contact_sportsbook.name,
          sportsbook_email: form.contact_sportsbook.email,
          platform_url: form.platform_url,
          country: form.country,
          psps,
          form_data: form,
        },
      });
    }

    void logActivity({ clientId, action: "form_submitted" });

    // Always route to /success first — the Trivelta AI hero moment
    // is intentional UX for all clients. /success handles onward routing to Studio.
    navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    setSubmitting(false);
  };

  const handleSubmit = () => {
    if (!isOwner) return;
    if (isFormComplete(form)) {
      executeSubmit();
      return;
    }

    // Mark as attempted - triggers red borders + error messages in all sections
    setSubmitAttempted(true);
    setShakeErrors(true);
    setTimeout(() => setShakeErrors(false), 500);

    // Find incomplete sections
    const SECTION_NAMES: Record<string, string> = {
      "1": "Team Contacts",
      "2": "Media & Branding",
      "3": "Platform Setup",
      "4": "Legal & Policies",
      "5": "3rd Party",
    };
    const incomplete = ["1", "2", "3", "4", "5"].filter((id) => !sectionDone[id]);
    const firstIncomplete = incomplete[0];

    // Open the first incomplete section
    if (firstIncomplete && !open.includes(firstIncomplete)) {
      setOpen((prev) => [...prev, firstIncomplete]);
    }

    // Scroll to first incomplete section after opening
    setTimeout(() => {
      const el = document.querySelector(`[data-section-id="${firstIncomplete}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    // Build summary of missing fields per section
    const missingParts = incomplete.map((id) => {
      const { filled, total } = sectionFieldStats(id, form);
      return `Section ${id.padStart(2, "0")} - ${SECTION_NAMES[id]}: ${total - filled} field${total - filled !== 1 ? "s" : ""} missing`;
    });

    toast.error(
      `Please complete all required fields before submitting.\n${missingParts.join("\n")}`,
      { duration: 6000, style: { whiteSpace: "pre-line" } },
    );
  };

  if (authLoading || loading || loadingPublic || loadingAuth) {
    return <OnboardingLoadingScreen />;
  }
  if (!user) return null;

  return (
    <div className="route-fade-in flex min-h-screen flex-col">
      {/* Auto-save status indicator */}
      <SaveStatus
        status={saveStatus}
        lastSaved={autoSavedAt}
        onRetry={() => autoSaveSubscriberRef.current?.({ data: form as unknown })}
      />
      {/* Sticky brand nav with progress bar underneath */}
      <TriveltaNav
        product="Hub"
        homeHref={`/onboarding/${clientId}`}
        right={
          <div className="flex items-center gap-3">
            <PresenceAvatars users={otherUsers} />
            <div className="text-right">
              <div className="text-[13px] font-semibold text-foreground">
                {welcomeInfo?.clientName ?? "Onboarding"}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                <span className="text-foreground">{filled}</span>
                <span> / {total} fields complete</span>
              </div>
            </div>
          </div>
        }
        bottomSlot={
          <div className="h-[3px] w-full bg-border/40">
            <div
              className={cn(
                "h-full transition-all duration-500",
                completion >= 100 ? "bg-success" : "progress-shimmer",
              )}
              style={{ width: `${completion}%` }}
            />
          </div>
        }
      />

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 pb-32">
          {/* Owner-only access notice (top, subtle) */}
          {!isOwner && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-[13px] leading-relaxed text-muted-foreground">
                You can fill in any field - only{" "}
                <span className="font-medium text-foreground">
                  {ownerEmail ?? "the account owner"}
                </span>{" "}
                can submit this form for review.
              </div>
            </div>
          )}

          {/* Page heading */}
          <div className="mb-8">
            <div className="micro-label mb-2">Onboarding · Setup</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[34px]">
              Build your platform
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              Five sections, all auto-saved. Jump in and out - your team can collaborate live.
            </p>
          </div>

          {/* Connected stepper */}
          <nav className="mb-8" aria-label="Onboarding progress">
            <ol className="flex items-start justify-between">
              {[
                { id: "1", label: "Team" },
                { id: "2", label: "Branding" },
                { id: "3", label: "Platform" },
                { id: "4", label: "Legal" },
                { id: "5", label: "3rd Party" },
              ].map((s, idx, arr) => {
                const done = sectionDone[s.id];
                const { filled, total } = sectionFieldStats(s.id, form);
                const isActive = open.includes(s.id);
                const hasError = submitAttempted && !done;
                const inProgress = !done && filled > 0;
                const nextDone = idx < arr.length - 1 && sectionDone[arr[idx + 1].id];
                return (
                  <li key={s.id} className="relative flex flex-1 flex-col items-center">
                    {/* Connector to next */}
                    {idx < arr.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-1/2 top-[18px] h-[2px] w-full",
                          done && nextDone ? "stepper-line-active" : "stepper-line",
                        )}
                      />
                    )}
                    <button
                      type="button"
                      aria-label={`Go to step ${idx + 1}: ${s.label}`}
                      onClick={() => {
                        setOpen((prev) => (prev.includes(s.id) ? prev : [...prev, s.id]));
                        setCurrentSection(s.id);
                        if (myPresenceRef.current && presenceChannelRef.current) {
                          const updated: PresencePayload = {
                            ...myPresenceRef.current,
                            current_section: s.id,
                            last_active: new Date().toISOString(),
                          };
                          myPresenceRef.current = updated;
                          presenceChannelRef.current.track(updated);
                        }
                        setTimeout(() => {
                          const el = document.querySelector(`[data-section-id="${s.id}"]`);
                          el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 60);
                      }}
                      className="group relative z-10 flex cursor-pointer flex-col items-center gap-2 rounded-lg p-1 transition-transform active:scale-95 focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold transition-all",
                          done &&
                            "bg-success text-success-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-success)_18%,transparent)]",
                          !done &&
                            hasError &&
                            "bg-destructive/15 text-destructive ring-1 ring-destructive/40",
                          !done &&
                            !hasError &&
                            isActive &&
                            "scale-110 bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]",
                          !done &&
                            !hasError &&
                            !isActive &&
                            inProgress &&
                            "bg-primary/15 text-primary ring-1 ring-primary/30",
                          !done &&
                            !hasError &&
                            !isActive &&
                            !inProgress &&
                            "bg-card text-muted-foreground ring-1 ring-border group-hover:text-foreground",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : hasError ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <span className="font-mono">{idx + 1}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                          done
                            ? "text-success"
                            : hasError
                              ? "text-destructive"
                              : isActive || inProgress
                                ? "text-foreground"
                                : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                      {total > 0 && (
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/80">
                          {filled}/{total}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Accordion */}
          <Accordion
            type="multiple"
            value={open}
            onValueChange={handleSectionToggle}
            className="space-y-3"
          >
            <SectionShell
              id="1"
              num="01"
              title="Team Contacts"
              icon={Phone}
              done={sectionDone["1"]}
              desc="Sportsbook, operational & compliance leads + Slack team emails"
              sectionDesc="We'll use these contacts to set up your Slack channel and coordinate the onboarding."
              presenceUsers={otherUsers}
              fieldCount={sectionFieldStats("1", form)}
              hasError={submitAttempted && !sectionDone["1"]}
              shakeErrors={shakeErrors}
            >
              <SectionContacts
                form={form}
                updateContact={updateContact}
                update={update}
                showErrors={submitAttempted}
              />
            </SectionShell>
            <SectionShell
              id="2"
              num="02"
              title="Media & Branding"
              icon={Upload}
              done={sectionDone["2"]}
              desc="Confirm logo, icon and animation uploads to Drive"
              sectionDesc="Upload your brand assets to Drive. You can also create assets in Trivelta Studio after submitting."
              presenceUsers={otherUsers}
              fieldCount={sectionFieldStats("2", form)}
              hasError={submitAttempted && !sectionDone["2"]}
              shakeErrors={shakeErrors}
            >
              <SectionMedia
                form={form}
                update={update}
                driveLink={welcomeInfo?.driveLink ?? null}
                showErrors={submitAttempted}
                clientId={clientId}
                navigate={navigate}
                hasFullStudioAccess={studioAccess}
              />
            </SectionShell>
            <SectionShell
              id="3"
              num="03"
              title="Platform Setup"
              icon={Palette}
              done={sectionDone["3"]}
              desc="URL, country and DNS access"
              sectionDesc="Configure your platform URL, country, and DNS access. Colors are set in Trivelta Studio."
              presenceUsers={otherUsers}
              fieldCount={sectionFieldStats("3", form)}
              hasError={submitAttempted && !sectionDone["3"]}
              shakeErrors={shakeErrors}
            >
              <SectionPlatform form={form} update={update} showErrors={submitAttempted} />
            </SectionShell>
            <SectionShell
              id="4"
              num="04"
              title="Legal & Policies"
              icon={ScrollText}
              done={sectionDone["4"]}
              desc="Footer requirements, landing page and policy URLs"
              sectionDesc="These pages are required by law in most jurisdictions. Trivelta can help if you don't have them yet."
              presenceUsers={otherUsers}
              fieldCount={sectionFieldStats("4", form)}
              hasError={submitAttempted && !sectionDone["4"]}
              shakeErrors={shakeErrors}
            >
              <SectionLegal form={form} update={update} showErrors={submitAttempted} />
            </SectionShell>
            <SectionShell
              id="5"
              num="05"
              title="3rd Party Integrations"
              icon={Plug}
              done={sectionDone["5"]}
              desc="PSP, KYC, SMS, DUNS, Zendesk and analytics"
              sectionDesc="Select your payment providers and integrations. Your AM will contact each provider on your behalf."
              presenceUsers={otherUsers}
              fieldCount={sectionFieldStats("5", form)}
              hasError={submitAttempted && !sectionDone["5"]}
              shakeErrors={shakeErrors}
            >
              <SectionThirdParty form={form} update={update} showErrors={submitAttempted} country={form.country} />
            </SectionShell>
          </Accordion>
        </div>
      </main>

      {/* Sticky bottom submit bar */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tabular-nums text-foreground">
                {isFormComplete(form) ? "All set" : `${filled}`}
              </span>
              {!isFormComplete(form) && (
                <span className="text-[12px] text-muted-foreground">
                  of {total} required fields
                </span>
              )}
              {isFormComplete(form) && (
                <span className="text-[12px] text-success">- ready to submit</span>
              )}
            </div>
            <div className="mt-2 h-[3px] w-full max-w-[280px] overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  completion >= 100 ? "bg-success" : "progress-shimmer",
                )}
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {isOwner
                ? "Auto-saved · live sync"
                : `Owner: ${ownerEmail ?? "unknown"} · view-only`}
            </div>
          </div>
          <div className="flex items-center">
            {isOwner ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "h-11 min-w-[200px] px-6 text-[14px] font-semibold",
                  isFormComplete(form)
                    ? "btn-premium"
                    : "rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Submit to Trivelta <Send className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="rounded-full border border-border bg-card/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Lock className="mr-1.5 inline h-3 w-3" /> Owner-only submit
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Section shell ───────────────────────────────────────────── */

function SectionShell({
  id,
  num,
  title,
  icon: Icon,
  done,
  desc,
  sectionDesc,
  presenceUsers = [],
  fieldCount,
  hasError,
  shakeErrors,
  children,
}: {
  id: string;
  num: string;
  title: string;
  icon: React.ElementType;
  done: boolean;
  desc: string;
  sectionDesc?: string;
  presenceUsers?: PresenceUser[];
  fieldCount?: { filled: number; total: number };
  hasError?: boolean;
  shakeErrors?: boolean;
  children: React.ReactNode;
}) {
  const here = presenceUsers.filter((u) => u.current_section === id);
  const isTyping = here.some((u) => Date.now() - new Date(u.last_active).getTime() < 8_000);
  const pct =
    fieldCount && fieldCount.total > 0
      ? Math.round((fieldCount.filled / fieldCount.total) * 100)
      : 0;

  return (
    <AccordionItem
      value={id}
      data-section-id={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card transition-colors",
        done && "ring-1 ring-success/25",
        hasError && shakeErrors && "field-error-shake",
        hasError && !done && "border-destructive/30",
      )}
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/40 transition-colors [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg shrink-0",
              done
                ? "bg-success/15 text-success"
                : hasError
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
            )}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : hasError ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "font-mono text-[10px]",
                  done ? "text-success" : hasError ? "text-destructive" : "text-primary",
                )}
              >
                {num}
              </span>
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {fieldCount && fieldCount.total > 0 && (
                <span
                  className={cn(
                    "ml-auto font-mono text-[10px]",
                    done
                      ? "text-success"
                      : hasError
                        ? "text-destructive"
                        : pct > 0
                          ? "text-primary"
                          : "text-muted-foreground",
                  )}
                >
                  {fieldCount.filled}/{fieldCount.total} fields
                </span>
              )}
            </div>
            {/* Mini progress bar */}
            {fieldCount && fieldCount.total > 0 && (
              <div className="mt-1.5 h-[3px] w-full rounded-full bg-border/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    done
                      ? "bg-success"
                      : hasError
                        ? "bg-destructive/60"
                        : pct > 0
                          ? "bg-primary"
                          : "bg-border",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</div>
          </div>
          {/* Mini presence avatars in trigger */}
          {here.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2 shrink-0">
              <div className="flex -space-x-1.5">
                {here.slice(0, 3).map((u) => (
                  <div
                    key={u.user_email}
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-background"
                    style={{ backgroundColor: u.color }}
                    title={u.name}
                  >
                    {u.initials}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {here.length === 1
                  ? `${here[0].name.split(" ")[0]} is here`
                  : `${here.length} here`}
              </span>
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pt-5 pb-6">
        {/* "X is here" banner + typing indicator */}
        {here.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/15 px-3 py-2">
            <div className="flex -space-x-1.5">
              {here.map((u) => (
                <div
                  key={u.user_email}
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-background"
                  style={{ backgroundColor: u.color }}
                >
                  {u.initials}
                </div>
              ))}
            </div>
            <span className="text-[12px] text-primary/80">
              {here.length === 1
                ? `${here[0].name} is viewing this section`
                : `${here.map((u) => u.name.split(" ")[0]).join(" & ")} are viewing this section`}
            </span>
            {isTyping && (
              <span className="ml-auto flex items-end gap-0.5 pb-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1 w-1 rounded-full bg-primary/60"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </span>
            )}
          </div>
        )}
        {sectionDesc && (
          <p className="mb-4 text-[13px] text-muted-foreground leading-relaxed border-b border-border pb-4">
            {sectionDesc}
          </p>
        )}
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

/* ─── Shared helpers ──────────────────────────────────────────── */

function FieldGroup({
  label,
  required,
  fieldKey,
  children,
}: {
  label: string;
  required?: boolean;
  fieldKey?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center text-foreground/85">
        <span>{label}</span>
        {required && <span className="text-primary ml-0.5">*</span>}
        {fieldKey && <FieldInfo fieldKey={fieldKey} />}
      </Label>
      {children}
    </div>
  );
}

function YesNo({
  value,
  onChange,
  idPrefix,
}: {
  value: "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
  idPrefix: string;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as "yes" | "no")}
      className="flex gap-6 pt-1"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-yes`} value="yes" />
        <Label
          htmlFor={`${idPrefix}-yes`}
          className="cursor-pointer font-normal text-foreground/85"
        >
          Yes
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-no`} value="no" />
        <Label htmlFor={`${idPrefix}-no`} className="cursor-pointer font-normal text-foreground/85">
          No
        </Label>
      </div>
    </RadioGroup>
  );
}

function SubCard({
  title,
  fieldKey,
  children,
}: {
  title?: string;
  fieldKey?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      {title && (
        <div className="mb-3 flex items-center text-sm font-medium text-foreground">
          <span>{title}</span>
          {fieldKey && <FieldInfo fieldKey={fieldKey} />}
        </div>
      )}
      {children}
    </div>
  );
}

function ValidatedInput({
  type = "text",
  placeholder,
  value,
  onChange,
  pattern,
  errorMessage,
  forceError,
  requiredMessage,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  pattern?: RegExp;
  errorMessage?: string;
  forceError?: boolean;
  requiredMessage?: string;
}) {
  const [touched, setTouched] = useState(false);
  const patternInvalid = touched && !!value && !!pattern && !pattern.test(value);
  const showEmpty = !!forceError && !value;
  const isInvalid = patternInvalid || showEmpty;
  return (
    <div>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={isInvalid ? "border-destructive focus-visible:ring-destructive/50" : ""}
      />
      {showEmpty && requiredMessage && (
        <p className="mt-1 text-[11px] text-destructive">{requiredMessage}</p>
      )}
      {patternInvalid && !showEmpty && errorMessage && (
        <p className="mt-1 text-[11px] text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

function YesNoSkip({
  value,
  onChange,
  idPrefix,
}: {
  value: "yes" | "no" | "skip" | "";
  onChange: (v: "yes" | "no" | "skip") => void;
  idPrefix: string;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as "yes" | "no" | "skip")}
      className="flex gap-6 pt-1"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-yes`} value="yes" />
        <Label
          htmlFor={`${idPrefix}-yes`}
          className="cursor-pointer font-normal text-foreground/85"
        >
          Yes
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-no`} value="no" />
        <Label htmlFor={`${idPrefix}-no`} className="cursor-pointer font-normal text-foreground/85">
          No
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-skip`} value="skip" />
        <Label
          htmlFor={`${idPrefix}-skip`}
          className="cursor-pointer font-normal text-foreground/85"
        >
          Skip
        </Label>
      </div>
    </RadioGroup>
  );
}

/* ─── Section 1: Contacts ─────────────────────────────────────── */

function ContactBlockEditor({
  title,
  value,
  onChange,
  showErrors,
}: {
  title: string;
  value: ContactBlock;
  onChange: (field: keyof ContactBlock, v: string) => void;
  showErrors?: boolean;
}) {
  const reqErr = (v: string) => (showErrors && !v ? "This field is required" : undefined);
  return (
    <SubCard title={title}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Full name *</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Jane Smith"
            className={cn(
              showErrors && !value.name
                ? "border-destructive focus-visible:ring-destructive/50"
                : "",
            )}
          />
          {reqErr(value.name) && (
            <p className="text-[11px] text-destructive">{reqErr(value.name)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email *</Label>
          <ValidatedInput
            type="email"
            value={value.email}
            onChange={(v) => onChange("email", v)}
            placeholder="name@company.com"
            pattern={/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/}
            errorMessage="Please enter a valid email address"
            forceError={showErrors && !value.email}
            requiredMessage="This field is required"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Phone *</Label>
          <ValidatedInput
            type="tel"
            value={value.phone}
            onChange={(v) => onChange("phone", v)}
            placeholder="+234 801 234 5678"
            pattern={/^\+?[0-9\s\-()\u200b]{7,20}$/}
            errorMessage="Please enter a valid phone number"
            forceError={showErrors && !value.phone}
            requiredMessage="This field is required"
          />
        </div>
      </div>
    </SubCard>
  );
}

function SectionContacts({
  form,
  updateContact,
  update,
  showErrors,
}: {
  form: FormShape;
  updateContact: (
    key: "contact_sportsbook" | "contact_operational" | "contact_compliance",
    field: keyof ContactBlock,
    value: string,
  ) => void;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  showErrors?: boolean;
}) {
  return (
    <div className="space-y-4">
      <ContactBlockEditor
        title="Sportsbook contact"
        value={form.contact_sportsbook}
        onChange={(f, v) => updateContact("contact_sportsbook", f, v)}
        showErrors={showErrors}
      />
      <ContactBlockEditor
        title="Operational contact"
        value={form.contact_operational}
        onChange={(f, v) => updateContact("contact_operational", f, v)}
        showErrors={showErrors}
      />
      <ContactBlockEditor
        title="Compliance contact"
        value={form.contact_compliance}
        onChange={(f, v) => updateContact("contact_compliance", f, v)}
        showErrors={showErrors}
      />
      <FieldGroup label="Slack team member emails">
        <Textarea
          placeholder="one email per line"
          value={form.slack_team_emails}
          onChange={(e) => update("slack_team_emails", e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          We'll invite these emails to the shared Slack channel.
        </p>
      </FieldGroup>
    </div>
  );
}

/* ─── Section 2: Media & Branding ────────────────────────────── */

function DriveButton({ driveLink }: { driveLink: string | null }) {
  return (
    <button
      type="button"
      onClick={() => driveLink && window.open(driveLink, "_blank", "noopener,noreferrer")}
      disabled={!driveLink}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5",
        !driveLink && "cursor-not-allowed opacity-40",
      )}
    >
      <ExternalLink className="h-3.5 w-3.5 text-primary" />
      Upload to Drive
    </button>
  );
}

function AssetRow({
  label,
  spec,
  checked,
  onChange,
  driveLink,
  required,
  hasError,
}: {
  label: string;
  spec: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  driveLink: string | null;
  required?: boolean;
  hasError?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-background/30 px-4 py-3",
        hasError ? "border-destructive/50 bg-destructive/5" : "border-border/50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{spec}</div>
      </div>
      <DriveButton driveLink={driveLink} />
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground select-none">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="h-4 w-4" />
        Uploaded
      </label>
    </div>
  );
}

function AssetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SectionMedia({
  form,
  update,
  driveLink,
  showErrors,
  clientId,
  navigate,
  hasFullStudioAccess,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  driveLink: string | null;
  showErrors?: boolean;
  clientId: string;
  navigate: ReturnType<typeof useNavigate>;
  hasFullStudioAccess?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* eslint-disable-next-line no-console */}
      {(console.log("[DEBUG] SectionMedia render — hasFullStudioAccess prop:", hasFullStudioAccess), null)}

      {/* Two-card layout: Landing Page Generator (always active) + Full Studio (locked/active) */}
      <div className="space-y-4">
        {/* Card 1: Landing Page Generator — always active */}
        <ActiveLandingPageCard clientId={clientId} />

        {/* Card 2: Full Studio — locked until AE grants access */}
        {hasFullStudioAccess ? (
          <ActiveFullStudioCard clientId={clientId} />
        ) : (
          <LockedFullStudioTeaser />
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Click 'Upload to Drive' to open your shared Google Drive folder and upload each file.
          After submitting, you'll access Trivelta Studio to generate or refine assets with AI.
        </span>
      </div>

      {/* Group 1 - Logos */}
      <AssetGroup title="Logos">
        <AssetRow
          label="Company Logo"
          spec="PNG - max 4MB - 512x512px"
          checked={form.asset_company_logo}
          onChange={(v) => update("asset_company_logo", v)}
          driveLink={driveLink}
          required
          hasError={showErrors && !form.asset_company_logo}
        />
        <AssetRow
          label="App Name Logo"
          spec="PNG - max 4MB - 148x48px"
          checked={form.asset_app_name_logo}
          onChange={(v) => update("asset_app_name_logo", v)}
          driveLink={driveLink}
          required
          hasError={showErrors && !form.asset_app_name_logo}
        />
      </AssetGroup>

      {/* Group 2 - Icons */}
      <AssetGroup title="Icons">
        <AssetRow
          label="Currency Icon"
          spec="PNG - max 1MB - 64x64px"
          checked={form.asset_currency_icon}
          onChange={(v) => update("asset_currency_icon", v)}
          driveLink={driveLink}
        />
        <AssetRow
          label="Top Left App Icon"
          spec="PNG - max 2MB - 96x96px"
          checked={form.asset_top_left_icon}
          onChange={(v) => update("asset_top_left_icon", v)}
          driveLink={driveLink}
          required
          hasError={showErrors && !form.asset_top_left_icon}
        />
        <AssetRow
          label="Website Favicon"
          spec="ICO - max 2MB - 32x32px"
          checked={form.asset_favicon}
          onChange={(v) => update("asset_favicon", v)}
          driveLink={driveLink}
        />
      </AssetGroup>

      {/* Group 3 - App Store Icons */}
      <AssetGroup title="App Store Icons">
        <AssetRow
          label="iOS App Icon"
          spec="PNG - max 5MB - 1024x1024px"
          checked={form.asset_ios_icon}
          onChange={(v) => update("asset_ios_icon", v)}
          driveLink={driveLink}
        />
        <AssetRow
          label="Android App Icon"
          spec="PNG - max 5MB - 1024x1024px"
          checked={form.asset_android_icon}
          onChange={(v) => update("asset_android_icon", v)}
          driveLink={driveLink}
        />
      </AssetGroup>

      {/* Group 4 - Animations */}
      <AssetGroup title="Animations">
        <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          All animations in JSON (Lottie) format via After Effects Bodymovin.
        </div>
        <AssetRow
          label="Loading Animation"
          spec="JSON (Lottie) - 48x48px"
          checked={form.asset_loading_anim}
          onChange={(v) => update("asset_loading_anim", v)}
          driveLink={driveLink}
        />
        <AssetRow
          label="Splash Screen Animation"
          spec="JSON (Lottie) - 68x68px"
          checked={form.asset_splash_anim}
          onChange={(v) => update("asset_splash_anim", v)}
          driveLink={driveLink}
        />
        <AssetRow
          label="Live Icon Animation"
          spec="JSON (Lottie)"
          checked={form.asset_live_icon_anim}
          onChange={(v) => update("asset_live_icon_anim", v)}
          driveLink={driveLink}
        />
      </AssetGroup>

      <p className="text-[11px] text-muted-foreground">
        Fields marked <span className="text-destructive">*</span> are required before you can
        submit.
      </p>
    </div>
  );
}

/* ─── Section 3: Platform Setup ──────────────────────────────── */

function SectionPlatform({
  form,
  update,
  showErrors,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  showErrors?: boolean;
}) {
  const fe = (v: string | boolean) => showErrors && !v;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Platform URL" required>
          <Input
            placeholder="https://yourwebsite.com"
            value={form.platform_url}
            onChange={(e) => update("platform_url", e.target.value)}
            className={cn(
              fe(form.platform_url) ? "border-destructive focus-visible:ring-destructive/50" : "",
            )}
          />
          {fe(form.platform_url) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        <FieldGroup label="Country" required>
          <Select value={form.country} onValueChange={(v) => update("country", v)}>
            <SelectTrigger className={cn(fe(form.country) ? "border-destructive" : "")}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fe(form.country) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
          {form.country === "Other" && (
            <>
              <Input
                className="mt-2"
                placeholder="Please specify your country…"
                value={form.country_other}
                onChange={(e) => update("country_other", e.target.value)}
              />
            </>
          )}
        </FieldGroup>
        <FieldGroup label="DNS provider" required>
          <Input
            placeholder="Cloudflare, GoDaddy, …"
            value={form.dns_provider}
            onChange={(e) => update("dns_provider", e.target.value)}
            className={cn(
              fe(form.dns_provider) ? "border-destructive focus-visible:ring-destructive/50" : "",
            )}
          />
          {fe(form.dns_provider) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        <FieldGroup label="Grant DNS access?" required>
          <YesNo value={form.dns_access} onChange={(v) => update("dns_access", v)} idPrefix="dns" />
          {fe(form.dns_access) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Your platform colors will be configured in{" "}
          <span className="font-medium text-foreground">Trivelta Studio</span> after submitting this
          form - where you can preview your app live as you choose colors and generate brand assets.
        </p>
      </div>
    </div>
  );
}

/* ─── Section 4: Legal & Policies ────────────────────────────── */

function SectionLegal({
  form,
  update,
  showErrors,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  showErrors?: boolean;
}) {
  const fe = (v: string | boolean) => showErrors && !v;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Footer required?" required>
          <YesNo
            value={form.footer_required}
            onChange={(v) => update("footer_required", v)}
            idPrefix="footer"
          />
          {fe(form.footer_required) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        <FieldGroup label="Landing page needed?" required>
          <YesNo
            value={form.landing_page}
            onChange={(v) => update("landing_page", v)}
            idPrefix="landing"
          />
          {fe(form.landing_page) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Terms & Conditions URL" required>
          <Input
            placeholder="https://yourwebsite.com/terms"
            value={form.terms_url}
            onChange={(e) => update("terms_url", e.target.value)}
            className={cn(
              fe(form.terms_url) ? "border-destructive focus-visible:ring-destructive/50" : "",
            )}
          />
          {fe(form.terms_url) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        <FieldGroup label="Privacy Policy URL" required>
          <Input
            placeholder="https://yourwebsite.com/privacy"
            value={form.privacy_url}
            onChange={(e) => update("privacy_url", e.target.value)}
            className={cn(
              fe(form.privacy_url) ? "border-destructive focus-visible:ring-destructive/50" : "",
            )}
          />
          {fe(form.privacy_url) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        <FieldGroup label="Responsible Gaming URL" required>
          <Input
            placeholder="https://yourwebsite.com/responsible-gaming"
            value={form.rg_url}
            onChange={(e) => update("rg_url", e.target.value)}
            className={cn(
              fe(form.rg_url) ? "border-destructive focus-visible:ring-destructive/50" : "",
            )}
          />
          {fe(form.rg_url) && (
            <p className="mt-1 text-[11px] text-destructive">This field is required</p>
          )}
        </FieldGroup>
        {form.landing_page === "yes" && (
          <FieldGroup label="Landing page URL" required>
            <Input
              placeholder="https://yourwebsite.com"
              value={form.landing_page_url}
              onChange={(e) => update("landing_page_url", e.target.value)}
              className={cn(
                fe(form.landing_page_url)
                  ? "border-destructive focus-visible:ring-destructive/50"
                  : "",
              )}
            />
            {fe(form.landing_page_url) && (
              <p className="mt-1 text-[11px] text-destructive">This field is required</p>
            )}
          </FieldGroup>
        )}
      </div>
    </div>
  );
}

/* ─── Payment Provider list ───────────────────────────────────── */

const PAYMENT_PROVIDER_GROUPS: Array<{ group: string; options: string[] }> = [
  {
    group: "Africa",
    options: [
      "Cellulant", "Flutterwave", "Interswitch", "M-Pesa", "MFS Africa",
      "Monnify", "Mukuru", "NETcash", "OPay", "Ozow", "PalmPay",
      "PayFast", "Paystack", "Peach Payments", "Pesapal", "Remita",
      "Squad", "Yellowpay", "Yoco",
    ],
  },
  {
    group: "LATAM",
    options: [
      "AstroPay", "Conekta", "dLocal", "EBANX", "Khipu", "Kushki",
      "MercadoPago", "Openpay", "Pago Fácil", "PagSeguro", "Payku",
      "PicPay", "PIX Direct", "RapiPago", "SafetyPay", "Webpay",
    ],
  },
  {
    group: "Crypto / Stablecoin",
    options: [
      "Bitolo", "BitPay", "Coinbase Commerce", "CoinPayments",
      "Confirmo", "CryptoProcessing", "MoonPay", "NOWPayments",
      "Triple-A", "Utorg",
    ],
  },
  {
    group: "Global Tier-1",
    options: [
      "Adyen", "Aeropay", "Apple Pay", "Boku", "Checkout.com",
      "ecoPayz", "Evervault", "Finix", "GiroPay", "Google Pay",
      "Klarna", "Neteller", "NMI", "Paysafe", "Skrill",
      "Sofort", "Stripe", "Trustly", "Worldpay",
    ],
  },
  {
    group: "iGaming Specialized",
    options: [
      "Cashlib", "Continent 8", "Dimoco", "EMerchantPay", "Inpay",
      "Intergiro", "iSignthis", "Jeton", "MuchBetter", "Nuvei",
      "PaymentIQ", "Praxis Cashier", "Rapid Transfer",
    ],
  },
];

const ALL_PAYMENT_PROVIDERS: string[] = PAYMENT_PROVIDER_GROUPS.flatMap((g) => g.options).sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase()),
);
const OTHER_PROVIDER = "Other (please specify)";

/* ─── MultiSelectCombobox ─────────────────────────────────────── */

function MultiSelectCombobox({
  selected,
  onChange,
  hasError,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allOptions = [...ALL_PAYMENT_PROVIDERS, OTHER_PROVIDER];
  const filtered = search.trim()
    ? allOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : allOptions;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              hasError ? "border-destructive" : "",
            )}
          >
            <span className="text-muted-foreground">
              {selected.length === 0
                ? "Search and select providers…"
                : `${selected.length} provider${selected.length !== 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search providers…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[280px]">
              <CommandEmpty>No providers found.</CommandEmpty>
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => toggle(option)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px]"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${s}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Section 5: 3rd Party ───────────────────────────────────── */

function SectionThirdParty({
  form,
  update,
  showErrors,
  country,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  showErrors?: boolean;
  country?: string;
}) {
  const pspOk = form.payment_providers.length > 0;

  return (
    <div className="space-y-4">
      <SubCard title="Payment service providers *" fieldKey="payment_service_providers">
        <PaymentProviderSelect
          value={form.payment_providers}
          onChange={(v) => update("payment_providers", v)}
          otherValue={form.payment_providers_other}
          onOtherChange={(v) => update("payment_providers_other", v)}
          country={country}
          hasError={showErrors && !pspOk}
        />
        {showErrors && !pspOk && (
          <p className="mt-2 text-[11px] text-destructive">Select at least one payment provider</p>
        )}
        {form.payment_providers.includes("Other (please specify)") && (
          <OtherIntegrationDisclaimer />
        )}
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Routing priority</Label>
          <Textarea
            placeholder="e.g. Paystack first, fallback to Opay…"
            value={form.psp_priority}
            onChange={(e) => update("psp_priority", e.target.value)}
            rows={2}
          />
        </div>
      </SubCard>

      <SubCard title="KYC SURT integration *" fieldKey="kyc_surt_integration">
        <YesNo value={form.kyc_surt} onChange={(v) => update("kyc_surt", v)} idPrefix="kyc" />
        {showErrors && !form.kyc_surt && (
          <p className="mt-2 text-[11px] text-destructive">This field is required</p>
        )}
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Notes</Label>
          <Textarea
            value={form.kyc_notes}
            onChange={(e) => update("kyc_notes", e.target.value)}
            rows={2}
          />
        </div>
      </SubCard>

      <SubCard title="Affiliate marketing" fieldKey="affiliate_marketing">
        <div className="space-y-3">
          <FieldGroup label="Do you have an existing affiliate marketing system?">
            <RadioGroup
              value={
                form.affiliate_marketing_existing === true
                  ? "yes"
                  : form.affiliate_marketing_existing === false
                    ? "no"
                    : ""
              }
              onValueChange={(v) =>
                update("affiliate_marketing_existing", v === "yes" ? true : false)
              }
              className="flex gap-6 pt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="aff-yes" value="yes" />
                <Label htmlFor="aff-yes" className="cursor-pointer font-normal text-foreground/85">
                  Yes
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="aff-no" value="no" />
                <Label htmlFor="aff-no" className="cursor-pointer font-normal text-foreground/85">
                  No
                </Label>
              </div>
            </RadioGroup>
          </FieldGroup>

          {form.affiliate_marketing_existing === true && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-background/30 p-3">
              <FieldGroup label="Which affiliate marketing system?">
                <Select
                  value={form.affiliate_marketing_system}
                  onValueChange={(v) => update("affiliate_marketing_system", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a system…" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Affilka by SOFTSWISS",
                      "Cake",
                      "Cellxpert",
                      "HasOffers (TUNE)",
                      "Income Access",
                      "MyAffiliates",
                      "NetRefer",
                      "PostAffiliate Pro",
                      "Scaleo",
                      "Smartico",
                      "Trackier",
                      "Voluum",
                      "Other (please specify)",
                    ].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              {form.affiliate_marketing_system === "Other (please specify)" && (
                <FieldGroup label="Please specify">
                  <Input
                    placeholder="Name of your affiliate system…"
                    value={form.affiliate_marketing_system_other}
                    onChange={(e) => update("affiliate_marketing_system_other", e.target.value)}
                  />
                </FieldGroup>
              )}
            </div>
          )}
        </div>
      </SubCard>

      <SubCard title="DUNS number *" fieldKey="duns_number">
        <RadioGroup
          value={form.duns_status}
          onValueChange={(v) => update("duns_status", v as FormShape["duns_status"])}
          className="flex flex-wrap gap-6"
        >
          {[
            { v: "have", label: "We have one" },
            { v: "in_progress", label: "In progress" },
            { v: "none", label: "Not yet" },
          ].map((o) => (
            <div key={o.v} className="flex items-center gap-2">
              <RadioGroupItem id={`duns-${o.v}`} value={o.v} />
              <Label
                htmlFor={`duns-${o.v}`}
                className="cursor-pointer font-normal text-foreground/85"
              >
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {showErrors && !form.duns_status && (
          <p className="mt-2 text-[11px] text-destructive">This field is required</p>
        )}
        {form.duns_status === "have" && (
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">DUNS number</Label>
            <Input
              value={form.duns_number}
              onChange={(e) => update("duns_number", e.target.value)}
              className="font-mono"
            />
          </div>
        )}
      </SubCard>

      <SubCard title="Zendesk widget *" fieldKey="zendesk_account">
        <YesNo value={form.zendesk} onChange={(v) => update("zendesk", v)} idPrefix="zendesk" />
        {showErrors && !form.zendesk && (
          <p className="mt-2 text-[11px] text-destructive">This field is required</p>
        )}
        {form.zendesk === "yes" && (
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Embed script</Label>
            <Textarea
              placeholder="<script>…</script>"
              value={form.zendesk_script}
              onChange={(e) => update("zendesk_script", e.target.value)}
              rows={3}
              className="font-mono text-xs"
            />
          </div>
        )}
      </SubCard>

      <SubCard title="Analytics tags" fieldKey="advertising_pixels">
        <div className="flex flex-wrap gap-5">
          {[
            { k: "analytics_meta", label: "Meta Pixel" },
            { k: "analytics_ga", label: "Google Analytics" },
            { k: "analytics_gtm", label: "GTM" },
            { k: "analytics_snapchat", label: "Snapchat Pixel" },
            { k: "analytics_reddit", label: "Reddit Pixel" },
            { k: "analytics_onefeed", label: "OneFeed" },
          ].map((p) => (
            <label
              key={p.k}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85"
            >
              <Checkbox
                checked={form[p.k as keyof FormShape] as boolean}
                onCheckedChange={(c) => update(p.k as keyof FormShape, !!c as never)}
              />
              {p.label}
            </label>
          ))}
        </div>
      </SubCard>
    </div>
  );
}
