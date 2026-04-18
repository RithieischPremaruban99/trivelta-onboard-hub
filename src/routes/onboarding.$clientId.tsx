import { createFileRoute, useParams, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorField } from "@/components/ColorField";
import {
  COUNTRIES,
  emptyForm,
  isFormComplete,
  validators,
  type ContactBlock,
  type FormShape,
} from "@/lib/onboarding-schema";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  Upload,
  Link as LinkIcon,
  Phone,
  Palette,
  ScrollText,
  Plug,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/$clientId")({
  component: OnboardingFormPage,
});

interface ClientRow {
  id: string;
  name: string;
  primary_contact_email: string | null;
  status: "onboarding" | "active" | "churned";
}

const SECTIONS = [
  { id: 1, title: "Contacts", icon: Phone },
  { id: 2, title: "Media & Branding", icon: Upload },
  { id: 3, title: "Platform Setup", icon: Palette },
  { id: 4, title: "Legal & Policies", icon: ScrollText },
  { id: 5, title: "3rd Party", icon: Plug },
];

function OnboardingFormPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId" });
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [form, setForm] = useState<FormShape>(emptyForm());
  const [section, setSection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      setLoading(true);
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .select("id, name, primary_contact_email, status")
        .eq("id", clientId)
        .maybeSingle();

      if (clientErr || !clientData) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      setClient(clientData as ClientRow);

      const { data: formData } = await supabase
        .from("onboarding_forms")
        .select("data, submitted_at")
        .eq("client_id", clientId)
        .maybeSingle();

      if (formData?.data) {
        setForm(emptyForm(formData.data as Partial<FormShape>));
      }
      if (formData?.submitted_at) setSubmitted(formData.submitted_at);
      setLoading(false);
    })();
  }, [clientId, user, authLoading]);

  const completion = useMemo(() => {
    const done = [1, 2, 3, 4, 5].filter((n) => validators[n](form)).length;
    return Math.round((done / 5) * 100);
  }, [form]);

  const update = <K extends keyof FormShape>(key: K, value: FormShape[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateContact = (
    key: "contact_sportsbook" | "contact_operational" | "contact_compliance",
    field: keyof ContactBlock,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: { ...f[key], [field]: value } }));

  const handleSubmit = async () => {
    if (!isFormComplete(form) || !client) return;
    setSubmitting(true);
    const submittedAt = new Date().toISOString();

    const { error } = await supabase
      .from("onboarding_forms")
      .upsert(
        { client_id: clientId, data: form as unknown as Record<string, unknown>, submitted_at: submittedAt },
        { onConflict: "client_id" },
      );

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // fire-and-monitor: notify edge function
    const { error: fnErr } = await supabase.functions.invoke("notify-submission", {
      body: {
        client_id: clientId,
        client_name: client.name,
        submitted_at: submittedAt,
        data: form,
      },
    });
    if (fnErr) console.warn("notify-submission failed:", fnErr.message);

    setSubmitted(submittedAt);
    setSubmitting(false);
    toast.success("Onboarding form submitted!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (forbidden) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <h1 className="text-xl font-semibold">Onboarding not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have access to this onboarding form, or the client doesn't exist.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Client Onboarding
            </div>
            <h1 className="mt-1 text-3xl font-semibold">{client?.name}</h1>
            {submitted && (
              <p className="mt-2 text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Submitted on {new Date(submitted).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-2xl font-semibold font-mono">{completion}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        {/* Section tabs */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SECTIONS.map((s) => {
            const ok = validators[s.id](form);
            const active = section === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-xs transition-colors",
                  active
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "bg-card hover:bg-accent text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[10px] font-mono",
                    ok
                      ? "border-success/40 bg-success/15 text-success"
                      : active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-secondary",
                  )}
                >
                  {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
                </div>
                <div className="flex-1">
                  <div className="hidden sm:block text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Section {s.id}
                  </div>
                  <div className="font-medium text-foreground">{s.title}</div>
                </div>
                <Icon className="hidden sm:block h-3.5 w-3.5 opacity-60" />
              </button>
            );
          })}
        </div>

        {/* Section content */}
        <div className="surface-card p-6 sm:p-8">
          {section === 1 && (
            <SectionContacts form={form} updateContact={updateContact} update={update} />
          )}
          {section === 2 && <SectionMedia form={form} update={update} />}
          {section === 3 && <SectionPlatform form={form} update={update} />}
          {section === 4 && <SectionLegal form={form} update={update} />}
          {section === 5 && <SectionThirdParty form={form} update={update} />}
        </div>

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={section === 1}
            onClick={() => setSection((s) => Math.max(1, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {section < 5 ? (
            <Button onClick={() => setSection((s) => Math.min(5, s + 1))}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete(form) || submitting || !!submitted}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Already submitted
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit onboarding form
                </>
              )}
            </Button>
          )}
        </div>

        {!isFormComplete(form) && section === 5 && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            Complete all required fields in every section to enable submission.
          </p>
        )}
      </div>
    </AppShell>
  );
}

/* ===================== SECTION COMPONENTS ===================== */

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function ContactBlockEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ContactBlock;
  onChange: (field: keyof ContactBlock, v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input value={value.name} onChange={(e) => onChange("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Phone</Label>
          <Input value={value.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function SectionContacts({
  form,
  updateContact,
  update,
}: {
  form: FormShape;
  updateContact: (
    key: "contact_sportsbook" | "contact_operational" | "contact_compliance",
    field: keyof ContactBlock,
    value: string,
  ) => void;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div>
      <SectionTitle title="Contacts" desc="Key people and Slack team members for this rollout." />
      <div className="space-y-4">
        <ContactBlockEditor
          title="Sportsbook lead"
          value={form.contact_sportsbook}
          onChange={(f, v) => updateContact("contact_sportsbook", f, v)}
        />
        <ContactBlockEditor
          title="Operational lead"
          value={form.contact_operational}
          onChange={(f, v) => updateContact("contact_operational", f, v)}
        />
        <ContactBlockEditor
          title="Compliance lead"
          value={form.contact_compliance}
          onChange={(f, v) => updateContact("contact_compliance", f, v)}
        />
        <div className="space-y-1.5">
          <Label>Slack team member emails</Label>
          <Textarea
            placeholder="one email per line"
            value={form.slack_team_emails}
            onChange={(e) => update("slack_team_emails", e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            We'll invite these emails to the Slack channel.
          </p>
        </div>
      </div>
    </div>
  );
}

function DriveDropZone({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center">
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">
          Drop file here or paste a Google Drive link below
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="https://drive.google.com/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

function SectionMedia({
  form,
  update,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="Media & Branding"
        desc="Provide logo, icon, and animation assets — drop files or share a Drive link."
      />
      <div className="grid gap-5 md:grid-cols-3">
        <DriveDropZone
          label="Logo"
          required
          value={form.logo_drive_link}
          onChange={(v) => update("logo_drive_link", v)}
        />
        <DriveDropZone
          label="Icon"
          required
          value={form.icon_drive_link}
          onChange={(v) => update("icon_drive_link", v)}
        />
        <DriveDropZone
          label="Animation"
          value={form.animation_drive_link}
          onChange={(v) => update("animation_drive_link", v)}
        />
      </div>
    </div>
  );
}

function SectionPlatform({
  form,
  update,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div>
      <SectionTitle title="Platform Setup" desc="URLs, DNS access, and brand colors." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Platform URL *</Label>
          <Input
            placeholder="https://yourbrand.com"
            value={form.platform_url}
            onChange={(e) => update("platform_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Country *</Label>
          <Select value={form.country} onValueChange={(v) => update("country", v)}>
            <SelectTrigger>
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
        </div>
        <div className="space-y-1.5">
          <Label>DNS provider *</Label>
          <Input
            placeholder="Cloudflare, GoDaddy, …"
            value={form.dns_provider}
            onChange={(e) => update("dns_provider", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Will you grant DNS access? *</Label>
          <RadioGroup
            value={form.dns_access}
            onValueChange={(v) => update("dns_access", v as FormShape["dns_access"])}
            className="flex gap-6 pt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="dns-yes" value="yes" />
              <Label htmlFor="dns-yes" className="cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="dns-no" value="no" />
              <Label htmlFor="dns-no" className="cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-medium">Brand colors</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ColorField label="Background" value={form.color_background} onChange={(v) => update("color_background", v)} />
          <ColorField label="Primary" value={form.color_primary} onChange={(v) => update("color_primary", v)} />
          <ColorField label="Secondary" value={form.color_secondary} onChange={(v) => update("color_secondary", v)} />
          <ColorField label="Light text" value={form.color_light_text} onChange={(v) => update("color_light_text", v)} />
          <ColorField label="Placeholder" value={form.color_placeholder} onChange={(v) => update("color_placeholder", v)} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium">Gradients</h3>
        <div className="space-y-4">
          {[
            { label: "Button gradient", a: "btn_gradient_a", b: "btn_gradient_b" },
            { label: "Box gradient", a: "box_gradient_a", b: "box_gradient_b" },
            { label: "Header gradient", a: "header_gradient_a", b: "header_gradient_b" },
            { label: "Won gradient", a: "won_gradient_a", b: "won_gradient_b" },
          ].map((g) => (
            <div key={g.label} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="text-sm font-medium">{g.label}</div>
                <div
                  className="h-6 w-32 rounded-md ring-1 ring-border"
                  style={{
                    background: `linear-gradient(90deg, ${form[g.a as keyof FormShape] as string}, ${form[g.b as keyof FormShape] as string})`,
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField
                  label="Start"
                  value={form[g.a as keyof FormShape] as string}
                  onChange={(v) => update(g.a as keyof FormShape, v as never)}
                />
                <ColorField
                  label="End"
                  value={form[g.b as keyof FormShape] as string}
                  onChange={(v) => update(g.b as keyof FormShape, v as never)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
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
      className="flex gap-6 pt-2"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-yes`} value="yes" />
        <Label htmlFor={`${idPrefix}-yes`} className="cursor-pointer">Yes</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${idPrefix}-no`} value="no" />
        <Label htmlFor={`${idPrefix}-no`} className="cursor-pointer">No</Label>
      </div>
    </RadioGroup>
  );
}

function SectionLegal({
  form,
  update,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div>
      <SectionTitle title="Legal & Policies" desc="Compliance pages and footer requirements." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Footer required? *</Label>
          <YesNo
            value={form.footer_required}
            onChange={(v) => update("footer_required", v)}
            idPrefix="footer"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Landing page needed? *</Label>
          <YesNo
            value={form.landing_page}
            onChange={(v) => update("landing_page", v)}
            idPrefix="landing"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Terms & Conditions URL *</Label>
          <Input
            placeholder="https://"
            value={form.terms_url}
            onChange={(e) => update("terms_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Privacy Policy URL *</Label>
          <Input
            placeholder="https://"
            value={form.privacy_url}
            onChange={(e) => update("privacy_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Responsible Gaming URL *</Label>
          <Input
            placeholder="https://"
            value={form.rg_url}
            onChange={(e) => update("rg_url", e.target.value)}
          />
        </div>
        {form.landing_page === "yes" && (
          <div className="space-y-1.5">
            <Label>Landing page URL *</Label>
            <Input
              placeholder="https://"
              value={form.landing_page_url}
              onChange={(e) => update("landing_page_url", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionThirdParty({
  form,
  update,
}: {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="Third Party Integrations"
        desc="Payment, KYC, SMS, support, analytics."
      />

      <div className="space-y-6">
        {/* PSP */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">Payment service providers *</div>
          <div className="flex flex-wrap gap-4">
            {[
              { k: "psp_opay", label: "Opay" },
              { k: "psp_palmpay", label: "PalmPay" },
              { k: "psp_paystack", label: "Paystack" },
            ].map((p) => (
              <label key={p.k} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form[p.k as keyof FormShape] as boolean}
                  onCheckedChange={(c) => update(p.k as keyof FormShape, !!c as never)}
                />
                {p.label}
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Routing priority</Label>
            <Textarea
              placeholder="e.g. Paystack first, fallback to Opay…"
              value={form.psp_priority}
              onChange={(e) => update("psp_priority", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* KYC */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">KYC SURT integration *</div>
          <YesNo
            value={form.kyc_surt}
            onChange={(v) => update("kyc_surt", v)}
            idPrefix="kyc"
          />
          <div className="mt-3 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea
              value={form.kyc_notes}
              onChange={(e) => update("kyc_notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* SMS */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">SMS provider *</div>
          <RadioGroup
            value={form.sms_provider}
            onValueChange={(v) => update("sms_provider", v as FormShape["sms_provider"])}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="sms-infobip" value="infobip" />
              <Label htmlFor="sms-infobip" className="cursor-pointer">Infobip</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="sms-other" value="other" />
              <Label htmlFor="sms-other" className="cursor-pointer">Other</Label>
            </div>
          </RadioGroup>
          {form.sms_provider === "other" && (
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Provider name</Label>
              <Input
                value={form.sms_provider_other}
                onChange={(e) => update("sms_provider_other", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* DUNS */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">DUNS number *</div>
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
                <Label htmlFor={`duns-${o.v}`} className="cursor-pointer">{o.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {form.duns_status === "have" && (
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground">DUNS number</Label>
              <Input
                value={form.duns_number}
                onChange={(e) => update("duns_number", e.target.value)}
                className="font-mono"
              />
            </div>
          )}
        </div>

        {/* Zendesk */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">Zendesk widget *</div>
          <YesNo
            value={form.zendesk}
            onChange={(v) => update("zendesk", v)}
            idPrefix="zendesk"
          />
          {form.zendesk === "yes" && (
            <div className="mt-3 space-y-1.5">
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
        </div>

        {/* Analytics */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 text-sm font-medium">Analytics tags</div>
          <div className="flex flex-wrap gap-4">
            {[
              { k: "analytics_meta", label: "Meta Pixel" },
              { k: "analytics_ga", label: "Google Analytics" },
              { k: "analytics_gtm", label: "Google Tag Manager" },
              { k: "analytics_snapchat", label: "Snapchat Pixel" },
              { k: "analytics_reddit", label: "Reddit Pixel" },
            ].map((p) => (
              <label key={p.k} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form[p.k as keyof FormShape] as boolean}
                  onCheckedChange={(c) => update(p.k as keyof FormShape, !!c as never)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
