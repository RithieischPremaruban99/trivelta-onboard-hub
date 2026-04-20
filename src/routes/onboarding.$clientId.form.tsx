import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TriveltaNav } from "@/components/TriveltaNav";

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
      const pspOk = f.psp_opay || f.psp_palmpay || f.psp_paystack;
      const smsOk =
        f.sms_provider === "infobip" || (f.sms_provider === "other" && !!f.sms_provider_other);
      const checks = [pspOk, !!f.kyc_surt, smsOk, !!f.duns_status, !!f.zendesk];
      return { filled: checks.filter(Boolean).length, total: 5 };
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
              title={`${u.name} — Section ${SECTION_LABELS[u.current_section] ?? u.current_section}`}
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

  // Presence
  const [otherUsers, setOtherUsers] = useState<PresenceUser[]>([]);
  const [currentSection, setCurrentSection] = useState("1");
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myPresenceRef = useRef<PresencePayload | null>(null);

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
      const { data: formData } = await supabase
        .from("onboarding_forms")
        .select("data, submitted_at")
        .eq("client_id", clientId)
        .maybeSingle();
      if (formData?.data) setForm(emptyForm(formData.data as Partial<FormShape>));
      if (formData?.submitted_at) {
        setSubmitted(formData.submitted_at);
        navigate({ to: "/onboarding/$clientId/studio", params: { clientId }, replace: true });
      }
      setLoading(false);
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
            navigate({ to: "/onboarding/$clientId/studio", params: { clientId } });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clientId]);

  // Auto-save
  useEffect(() => {
    if (!user || submitted) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      await supabase
        .from("onboarding_forms")
        .upsert([{ client_id: clientId, data: form as unknown as never }], {
          onConflict: "client_id",
        });
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, user, clientId, submitted]);

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
      const psps: string[] = [
        ...(form.psp_opay ? ["Opay"] : []),
        ...(form.psp_palmpay ? ["Palmpay"] : []),
        ...(form.psp_paystack ? ["Paystack"] : []),
      ];
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

    navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    setSubmitting(false);
  };

  const handleSubmit = () => {
    if (!isOwner) return;
    if (isFormComplete(form)) {
      executeSubmit();
      return;
    }

    // Mark as attempted — triggers red borders + error messages in all sections
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
      return `Section ${id.padStart(2, "0")} — ${SECTION_NAMES[id]}: ${total - filled} field${total - filled !== 1 ? "s" : ""} missing`;
    });

    toast.error(
      `Please complete all required fields before submitting.\n${missingParts.join("\n")}`,
      { duration: 6000, style: { whiteSpace: "pre-line" } },
    );
  };

  if (authLoading || loading || loadingPublic || loadingAuth) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="route-fade-in flex min-h-screen flex-col">
      {/* Sticky brand nav with progress bar underneath */}
      <TriveltaNav
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
        <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 pb-32">
          {/* Section pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "1", label: "01 Team Contacts" },
              { id: "2", label: "02 Media & Branding" },
              { id: "3", label: "03 Platform Setup" },
              { id: "4", label: "04 Legal & Policies" },
              { id: "5", label: "05 3rd Party" },
            ].map((s) => {
              const done = sectionDone[s.id];
              const { filled } = sectionFieldStats(s.id, form);
              const hasError = submitAttempted && !done;
              const status = done
                ? "complete"
                : hasError
                  ? "error"
                  : filled > 0
                    ? "progress"
                    : "empty";
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    setOpen((prev) =>
                      prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                    )
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                    status === "complete" && "border-success/40 bg-success/10 text-success",
                    status === "error" &&
                      "border-destructive/40 bg-destructive/10 text-destructive",
                    status === "progress" && "border-primary/40 bg-primary/10 text-primary",
                    status === "empty" &&
                      "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {status === "complete" && <CheckCircle2 className="h-3 w-3" />}
                  {status === "error" && <AlertTriangle className="h-3 w-3" />}
                  {status === "progress" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  {status === "empty" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>

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
              <SectionThirdParty form={form} update={update} showErrors={submitAttempted} />
            </SectionShell>
          </Accordion>
        </div>
      </main>

      {/* Fixed bottom submit bar */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="text-sm font-medium text-foreground">
              {isFormComplete(form)
                ? "All sections complete — ready to submit"
                : `${filled} of ${total} required fields complete`}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {isOwner
                ? "Progress is saved automatically."
                : `Only ${ownerEmail ?? "the account owner"} can submit.`}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isOwner ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "h-11 min-w-[200px] px-6 font-medium",
                  isFormComplete(form)
                    ? "btn-trivelta"
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
              <p className="max-w-[280px] text-right text-sm text-muted-foreground">
                Only{" "}
                <span className="font-medium text-foreground">
                  {ownerEmail ?? "the account owner"}
                </span>{" "}
                can submit this form.
                <span className="mt-0.5 block text-[12px]">You can still fill in any fields.</span>
              </p>
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground/85">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
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

function SubCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      {title && <div className="mb-3 text-sm font-medium text-foreground">{title}</div>}
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
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  driveLink: string | null;
  showErrors?: boolean;
}) {
  return (
    <div className="space-y-6">
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
          form — where you can preview your app live as you choose colors and generate brand assets.
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

/* ─── Section 5: 3rd Party ───────────────────────────────────── */

function SectionThirdParty({
  form,
  update,
  showErrors,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  showErrors?: boolean;
}) {
  const pspOk = form.psp_opay || form.psp_palmpay || form.psp_paystack;
  const smsOk =
    form.sms_provider === "infobip" || (form.sms_provider === "other" && !!form.sms_provider_other);
  return (
    <div className="space-y-4">
      <SubCard title="Payment service providers *">
        <div
          className={cn(
            "flex flex-wrap gap-5 rounded-lg p-2 -m-2",
            showErrors && !pspOk ? "ring-1 ring-destructive/50 bg-destructive/5" : "",
          )}
        >
          {[
            { k: "psp_opay", label: "Opay" },
            { k: "psp_palmpay", label: "PalmPay" },
            { k: "psp_paystack", label: "Paystack" },
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
        {showErrors && !pspOk && (
          <p className="mt-2 text-[11px] text-destructive">Select at least one payment provider</p>
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
      <SubCard title="KYC SURT integration *">
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
      <SubCard title="SMS provider *">
        <RadioGroup
          value={form.sms_provider}
          onValueChange={(v) => update("sms_provider", v as FormShape["sms_provider"])}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="sms-infobip" value="infobip" />
            <Label htmlFor="sms-infobip" className="cursor-pointer font-normal text-foreground/85">
              Infobip
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="sms-other" value="other" />
            <Label htmlFor="sms-other" className="cursor-pointer font-normal text-foreground/85">
              Other
            </Label>
          </div>
        </RadioGroup>
        {showErrors && !smsOk && (
          <p className="mt-2 text-[11px] text-destructive">This field is required</p>
        )}
        {form.sms_provider === "other" && (
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Provider name</Label>
            <Input
              value={form.sms_provider_other}
              onChange={(e) => update("sms_provider_other", e.target.value)}
              className={cn(showErrors && !form.sms_provider_other ? "border-destructive" : "")}
            />
          </div>
        )}
      </SubCard>
      <SubCard title="DUNS number *">
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
      <SubCard title="Zendesk widget *">
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
      <SubCard title="Analytics tags">
        <div className="flex flex-wrap gap-5">
          {[
            { k: "analytics_meta", label: "Meta Pixel" },
            { k: "analytics_ga", label: "Google Analytics" },
            { k: "analytics_gtm", label: "GTM" },
            { k: "analytics_snapchat", label: "Snapchat Pixel" },
            { k: "analytics_reddit", label: "Reddit Pixel" },
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
