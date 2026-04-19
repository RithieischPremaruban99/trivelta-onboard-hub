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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TriveltaNav } from "@/components/TriveltaNav";

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
        navigate({ to: "/onboarding/$clientId/success", params: { clientId }, replace: true });
      }
      setLoading(false);
    })();
  }, [clientId, user, authLoading]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`form:${clientId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "onboarding_forms",
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        const remote = payload.new as { data: Partial<FormShape>; submitted_at: string | null };
        isRemoteUpdate.current = true;
        setForm(emptyForm(remote.data));
        if (remote.submitted_at) {
          setSubmitted(remote.submitted_at);
          navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, clientId]);

  // Auto-save
  useEffect(() => {
    if (!user || submitted) return;
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
    const timer = setTimeout(async () => {
      await supabase.from("onboarding_forms").upsert(
        [{ client_id: clientId, data: form as unknown as never }],
        { onConflict: "client_id" }
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, user, clientId, submitted]);

  const sectionDone = useMemo(
    () => Object.fromEntries([1, 2, 3, 4, 5].map((n) => [String(n), validators[n](form)])),
    [form],
  );

  const { filled, total } = useMemo(() => countRequiredFields(form), [form]);
  const completion = useMemo(() => Math.round((filled / total) * 100), [filled, total]);
  const isOwner = clientRole === "client_owner";

  const update = <K extends keyof FormShape>(key: K, value: FormShape[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const updateContact = (
    key: "contact_sportsbook" | "contact_operational" | "contact_compliance",
    field: keyof ContactBlock,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: { ...f[key], [field]: value } }));

  const handleSubmit = async () => {
    if (!isFormComplete(form) || !isOwner) return;
    setSubmitting(true);

    // 1. Submit via RPC - enforces ownership, marks submitted_at, and writes
    //    an immutable audit record to onboarding_submissions.
    //    The log_form_submission trigger also writes form_submissions.
    const { error } = await supabase
      .from("onboarding_forms")
      .upsert(
        {
          client_id: clientId,
          data: form as never,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "client_id" },
      );
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // 2. Create Notion page + SOP checklist (fire-and-forget - don't block navigation)
    if (welcomeInfo) {
      const psps: string[] = [
        ...(form.psp_opay     ? ["Opay"]     : []),
        ...(form.psp_palmpay  ? ["Palmpay"]  : []),
        ...(form.psp_paystack ? ["Paystack"] : []),
      ];
      supabase.functions.invoke("handle-submission", {
        body: {
          client_id:       clientId,
          client_name:     welcomeInfo.clientName,
          drive_link:      welcomeInfo.driveLink ?? null,
          am_name:         welcomeInfo.amName ?? null,
          am_email:        welcomeInfo.amEmail ?? null,
          sportsbook_name:  form.contact_sportsbook.name,
          sportsbook_email: form.contact_sportsbook.email,
          platform_url:    form.platform_url,
          country:         form.country,
          psps,
          form_data:       form,
        },
      });
    }

    navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    setSubmitting(false);
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
        right={
          <div className="text-right">
            <div className="text-[13px] font-semibold text-foreground">
              {welcomeInfo?.clientName ?? "Onboarding"}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              <span className="text-foreground">{filled}</span>
              <span> / {total} fields complete</span>
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
                    done
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Accordion */}
          <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-3">
            <SectionShell
              id="1"
              num="01"
              title="Team Contacts"
              icon={Phone}
              done={sectionDone["1"]}
              desc="Sportsbook, operational & compliance leads + Slack team emails"
              sectionDesc="We'll use these contacts to set up your Slack channel and coordinate the onboarding."
            >
              <SectionContacts form={form} updateContact={updateContact} update={update} />
            </SectionShell>
            <SectionShell
              id="2"
              num="02"
              title="Media & Branding"
              icon={Upload}
              done={sectionDone["2"]}
              desc="Confirm logo, icon and animation uploads to Drive"
              sectionDesc="Upload your brand assets to Drive. You can also create assets in Trivelta Studio after submitting."
            >
              <SectionMedia form={form} update={update} driveLink={welcomeInfo?.driveLink ?? null} />
            </SectionShell>
            <SectionShell
              id="3"
              num="03"
              title="Platform Setup"
              icon={Palette}
              done={sectionDone["3"]}
              desc="URL, country and DNS access"
              sectionDesc="Configure your platform URL, country, and DNS access. Colors are set in Trivelta Studio."
            >
              <SectionPlatform form={form} update={update} />
            </SectionShell>
            <SectionShell
              id="4"
              num="04"
              title="Legal & Policies"
              icon={ScrollText}
              done={sectionDone["4"]}
              desc="Footer requirements, landing page and policy URLs"
              sectionDesc="These pages are required by law in most jurisdictions. Trivelta can help if you don't have them yet."
            >
              <SectionLegal form={form} update={update} />
            </SectionShell>
            <SectionShell
              id="5"
              num="05"
              title="3rd Party Integrations"
              icon={Plug}
              done={sectionDone["5"]}
              desc="PSP, KYC, SMS, DUNS, Zendesk and analytics"
              sectionDesc="Select your payment providers and integrations. Your AM will contact each provider on your behalf."
            >
              <SectionThirdParty form={form} update={update} />
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
                ? "All sections complete - ready to submit"
                : `Complete all required fields to submit (${total - filled} remaining)`}
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
                disabled={!isFormComplete(form) || submitting}
                className={cn(
                  "h-11 min-w-[200px] px-6 font-medium",
                  isFormComplete(form)
                    ? "btn-trivelta"
                    : "rounded-full bg-secondary text-muted-foreground cursor-not-allowed",
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
                <span className="mt-0.5 block text-[12px]">
                  You can still fill in any fields.
                </span>
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Section shell ───────────────────────────────────────────── */

function SectionShell({ id, num, title, icon: Icon, done, desc, sectionDesc, children }: {
  id: string; num: string; title: string; icon: React.ElementType; done: boolean; desc: string; sectionDesc?: string; children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card transition-colors",
        done && "ring-1 ring-success/25",
      )}
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/40 transition-colors [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg shrink-0",
              done ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
            )}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("font-mono text-[10px]", done ? "text-success" : "text-primary")}>{num}</span>
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pt-5 pb-6">
        {sectionDesc && (
          <p className="mb-4 text-[13px] text-muted-foreground leading-relaxed border-b border-border pb-4">{sectionDesc}</p>
        )}
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

/* ─── Shared helpers ──────────────────────────────────────────── */

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

function YesNo({ value, onChange, idPrefix }: { value: "yes" | "no" | ""; onChange: (v: "yes" | "no") => void; idPrefix: string }) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as "yes" | "no")} className="flex gap-6 pt-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-yes`} value="yes" />
        <Label htmlFor={`${idPrefix}-yes`} className="cursor-pointer font-normal text-foreground/85">Yes</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-no`} value="no" />
        <Label htmlFor={`${idPrefix}-no`} className="cursor-pointer font-normal text-foreground/85">No</Label>
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
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  pattern?: RegExp;
  errorMessage?: string;
}) {
  const [touched, setTouched] = useState(false);
  const invalid = touched && !!value && !!pattern && !pattern.test(value);
  return (
    <div>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={invalid ? "border-destructive focus-visible:ring-destructive/50" : ""}
      />
      {invalid && errorMessage && (
        <p className="mt-1 text-[11px] text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

function YesNoSkip({ value, onChange, idPrefix }: {
  value: "yes" | "no" | "skip" | "";
  onChange: (v: "yes" | "no" | "skip") => void;
  idPrefix: string;
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as "yes" | "no" | "skip")} className="flex gap-6 pt-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-yes`} value="yes" />
        <Label htmlFor={`${idPrefix}-yes`} className="cursor-pointer font-normal text-foreground/85">Yes</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-no`} value="no" />
        <Label htmlFor={`${idPrefix}-no`} className="cursor-pointer font-normal text-foreground/85">No</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-skip`} value="skip" />
        <Label htmlFor={`${idPrefix}-skip`} className="cursor-pointer font-normal text-foreground/85">Skip</Label>
      </div>
    </RadioGroup>
  );
}

/* ─── Section 1: Contacts ─────────────────────────────────────── */

function ContactBlockEditor({ title, value, onChange }: { title: string; value: ContactBlock; onChange: (field: keyof ContactBlock, v: string) => void }) {
  return (
    <SubCard title={title}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Full name *</Label>
          <Input value={value.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email *</Label>
          <ValidatedInput
            type="email"
            value={value.email}
            onChange={(v) => onChange("email", v)}
            placeholder="name@company.com"
            pattern={/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/}
            errorMessage="Please enter a valid email address"
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
          />
        </div>
      </div>
    </SubCard>
  );
}

function SectionContacts({ form, updateContact, update }: {
  form: FormShape;
  updateContact: (key: "contact_sportsbook" | "contact_operational" | "contact_compliance", field: keyof ContactBlock, value: string) => void;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <ContactBlockEditor title="Sportsbook contact" value={form.contact_sportsbook} onChange={(f, v) => updateContact("contact_sportsbook", f, v)} />
      <ContactBlockEditor title="Operational contact" value={form.contact_operational} onChange={(f, v) => updateContact("contact_operational", f, v)} />
      <ContactBlockEditor title="Compliance contact" value={form.contact_compliance} onChange={(f, v) => updateContact("contact_compliance", f, v)} />
      <FieldGroup label="Slack team member emails">
        <Textarea placeholder="one email per line" value={form.slack_team_emails} onChange={(e) => update("slack_team_emails", e.target.value)} rows={4} />
        <p className="text-xs text-muted-foreground">We'll invite these emails to the shared Slack channel.</p>
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
}: {
  label: string;
  spec: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  driveLink: string | null;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{spec}</div>
      </div>
      <DriveButton driveLink={driveLink} />
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground select-none">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onChange(!!v)}
          className="h-4 w-4"
        />
        Uploaded
      </label>
    </div>
  );
}

function AssetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SectionMedia({ form, update, driveLink }: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  driveLink: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Click 'Upload to Drive' to open your shared Google Drive folder and upload each file. After submitting, you'll access Trivelta Studio to generate or refine assets with AI.
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
        />
        <AssetRow
          label="App Name Logo"
          spec="PNG - max 4MB - 148x48px"
          checked={form.asset_app_name_logo}
          onChange={(v) => update("asset_app_name_logo", v)}
          driveLink={driveLink}
          required
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
        Fields marked <span className="text-destructive">*</span> are required before you can submit.
      </p>
    </div>
  );
}

/* ─── Section 3: Platform Setup ──────────────────────────────── */

function SectionPlatform({ form, update }: { form: FormShape; update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Platform URL" required><Input placeholder="https://yourwebsite.com" value={form.platform_url} onChange={(e) => update("platform_url", e.target.value)} /></FieldGroup>
        <FieldGroup label="Country" required>
          <Select value={form.country} onValueChange={(v) => update("country", v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="DNS provider" required><Input placeholder="Cloudflare, GoDaddy, …" value={form.dns_provider} onChange={(e) => update("dns_provider", e.target.value)} /></FieldGroup>
        <FieldGroup label="Grant DNS access?" required><YesNo value={form.dns_access} onChange={(v) => update("dns_access", v)} idPrefix="dns" /></FieldGroup>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Your platform colors will be configured in{" "}
          <span className="font-medium text-foreground">Trivelta Studio</span> after
          submitting this form — where you can preview your app live as you choose colors
          and generate brand assets.
        </p>
      </div>
    </div>
  );
}

/* ─── Section 4: Legal & Policies ────────────────────────────── */

function SectionLegal({ form, update }: { form: FormShape; update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Footer required?" required><YesNo value={form.footer_required} onChange={(v) => update("footer_required", v)} idPrefix="footer" /></FieldGroup>
        <FieldGroup label="Landing page needed?" required><YesNo value={form.landing_page} onChange={(v) => update("landing_page", v)} idPrefix="landing" /></FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Terms & Conditions URL" required><Input placeholder="https://yourwebsite.com/terms" value={form.terms_url} onChange={(e) => update("terms_url", e.target.value)} /></FieldGroup>
        <FieldGroup label="Privacy Policy URL" required><Input placeholder="https://yourwebsite.com/privacy" value={form.privacy_url} onChange={(e) => update("privacy_url", e.target.value)} /></FieldGroup>
        <FieldGroup label="Responsible Gaming URL" required><Input placeholder="https://yourwebsite.com/responsible-gaming" value={form.rg_url} onChange={(e) => update("rg_url", e.target.value)} /></FieldGroup>
        {form.landing_page === "yes" && (
          <FieldGroup label="Landing page URL" required><Input placeholder="https://yourwebsite.com" value={form.landing_page_url} onChange={(e) => update("landing_page_url", e.target.value)} /></FieldGroup>
        )}
      </div>
    </div>
  );
}

/* ─── Section 5: 3rd Party ───────────────────────────────────── */

function SectionThirdParty({ form, update }: { form: FormShape; update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void }) {
  return (
    <div className="space-y-4">
      <SubCard title="Payment service providers *">
        <div className="flex flex-wrap gap-5">
          {[{ k: "psp_opay", label: "Opay" }, { k: "psp_palmpay", label: "PalmPay" }, { k: "psp_paystack", label: "Paystack" }].map((p) => (
            <label key={p.k} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
              <Checkbox checked={form[p.k as keyof FormShape] as boolean} onCheckedChange={(c) => update(p.k as keyof FormShape, !!c as never)} />{p.label}
            </label>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Routing priority</Label>
          <Textarea placeholder="e.g. Paystack first, fallback to Opay…" value={form.psp_priority} onChange={(e) => update("psp_priority", e.target.value)} rows={2} />
        </div>
      </SubCard>
      <SubCard title="KYC SURT integration *">
        <YesNo value={form.kyc_surt} onChange={(v) => update("kyc_surt", v)} idPrefix="kyc" />
        <div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">Notes</Label><Textarea value={form.kyc_notes} onChange={(e) => update("kyc_notes", e.target.value)} rows={2} /></div>
      </SubCard>
      <SubCard title="SMS provider *">
        <RadioGroup value={form.sms_provider} onValueChange={(v) => update("sms_provider", v as FormShape["sms_provider"])} className="flex gap-6">
          <div className="flex items-center gap-2"><RadioGroupItem id="sms-infobip" value="infobip" /><Label htmlFor="sms-infobip" className="cursor-pointer font-normal text-foreground/85">Infobip</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem id="sms-other" value="other" /><Label htmlFor="sms-other" className="cursor-pointer font-normal text-foreground/85">Other</Label></div>
        </RadioGroup>
        {form.sms_provider === "other" && (<div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">Provider name</Label><Input value={form.sms_provider_other} onChange={(e) => update("sms_provider_other", e.target.value)} /></div>)}
      </SubCard>
      <SubCard title="DUNS number *">
        <RadioGroup value={form.duns_status} onValueChange={(v) => update("duns_status", v as FormShape["duns_status"])} className="flex flex-wrap gap-6">
          {[{ v: "have", label: "We have one" }, { v: "in_progress", label: "In progress" }, { v: "none", label: "Not yet" }].map((o) => (
            <div key={o.v} className="flex items-center gap-2"><RadioGroupItem id={`duns-${o.v}`} value={o.v} /><Label htmlFor={`duns-${o.v}`} className="cursor-pointer font-normal text-foreground/85">{o.label}</Label></div>
          ))}
        </RadioGroup>
        {form.duns_status === "have" && (<div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">DUNS number</Label><Input value={form.duns_number} onChange={(e) => update("duns_number", e.target.value)} className="font-mono" /></div>)}
      </SubCard>
      <SubCard title="Zendesk widget *">
        <YesNo value={form.zendesk} onChange={(v) => update("zendesk", v)} idPrefix="zendesk" />
        {form.zendesk === "yes" && (<div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">Embed script</Label><Textarea placeholder="<script>…</script>" value={form.zendesk_script} onChange={(e) => update("zendesk_script", e.target.value)} rows={3} className="font-mono text-xs" /></div>)}
      </SubCard>
      <SubCard title="Analytics tags">
        <div className="flex flex-wrap gap-5">
          {[{ k: "analytics_meta", label: "Meta Pixel" }, { k: "analytics_ga", label: "Google Analytics" }, { k: "analytics_gtm", label: "GTM" }, { k: "analytics_snapchat", label: "Snapchat Pixel" }, { k: "analytics_reddit", label: "Reddit Pixel" }].map((p) => (
            <label key={p.k} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
              <Checkbox checked={form[p.k as keyof FormShape] as boolean} onCheckedChange={(c) => update(p.k as keyof FormShape, !!c as never)} />{p.label}
            </label>
          ))}
        </div>
      </SubCard>
    </div>
  );
}
