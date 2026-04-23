import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/contexts/StudioContext";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileX, Loader2, Send, Sparkles } from "lucide-react";
import { LogoUploadField } from "@/components/studio/LogoUploadField";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface LandingPageFormState {
  legalCompanyName: string;
  brandName: string;
  primaryDomain: string;
  platformSubdomain: string;
  supportEmail: string;
  supportHelpline: string;
  licenseJurisdiction: string;
  licenseNumber: string;
  rgHelplines: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
}

interface GeneratedPages {
  index: string;
  terms: string;
  privacy: string;
  rg: string;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const JURISDICTIONS = [
  "Nigeria (Federal Republic of Nigeria)",
  "South Africa (Western Cape Gambling Board)",
  "South Africa (other provincial board)",
  "Kenya (Betting Control & Licensing Board)",
  "Ghana (Gaming Commission of Ghana)",
  "Tanzania (Gaming Board of Tanzania)",
  "Uganda (National Lotteries & Gaming Regulatory Board)",
  "Mexico (SEGOB / DGJS)",
  "Curaçao (CGCB)",
  "Malta (MGA)",
  "Other (free text)",
] as const;

const RG_HELPLINES: Record<string, string> = {
  "Nigeria (Federal Republic of Nigeria)":
    "GambleAlert Nigeria\ngamblealert.org.ng\n+234 705 889 0073",
  "South Africa (Western Cape Gambling Board)":
    "Responsible Gambling Foundation\nresponsiblegambling.org.za\n0800 006 008",
  "South Africa (other provincial board)":
    "Responsible Gambling Foundation\nresponsiblegambling.org.za\n0800 006 008",
  "Kenya (Betting Control & Licensing Board)": "Gamblers Anonymous Kenya\ngakenya.org",
  "Ghana (Gaming Commission of Ghana)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Tanzania (Gaming Board of Tanzania)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Uganda (National Lotteries & Gaming Regulatory Board)":
    "Gamblers Anonymous International\ngamblersanonymous.org",
  "Mexico (SEGOB / DGJS)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Curaçao (CGCB)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Malta (MGA)":
    "GamCare\ngamcare.org.uk\n0808 802 0133\n\nGamblers Anonymous\ngamblersanonymous.org",
  "Other (free text)": "Gamblers Anonymous International\ngamblersanonymous.org",
};

const REQUIRED_FIELDS: (keyof LandingPageFormState)[] = [
  "legalCompanyName",
  "brandName",
  "primaryDomain",
  "supportEmail",
  "licenseJurisdiction",
  "brandPrimaryColor",
];

const DEFAULT_FORM: LandingPageFormState = {
  legalCompanyName: "",
  brandName: "",
  primaryDomain: "",
  platformSubdomain: "",
  supportEmail: "",
  supportHelpline: "",
  licenseJurisdiction: "",
  licenseNumber: "",
  rgHelplines: "",
  brandPrimaryColor: "#6366f1",
  brandAccentColor: "#8b5cf6",
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function rgbaToHex(rgba: string | undefined, fallback = "#6366f1"): string {
  if (!rgba) return fallback;
  const m = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!m) return fallback;
  const toHex = (n: string) =>
    Math.min(255, Math.round(parseFloat(n))).toString(16).padStart(2, "0");
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

/* ── Primitive sub-components (layout-agnostic) ───────────────────────────── */

function EmptyPreview({ label, minHeight }: { label: string; minHeight: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center"
      style={{ minHeight }}
    >
      <FileX className="h-10 w-10 text-muted-foreground/40 mb-4" />
      <h3 className="text-sm font-medium text-foreground">No preview yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Fill in the form and click Generate to see your {label} page.
      </p>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  required,
  compact,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn("font-medium", compact ? "text-xs" : "text-sm")}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
  );
}

function FieldHelper({
  error,
  helper,
  compact,
}: {
  error?: boolean;
  helper?: string;
  compact?: boolean;
}) {
  const cls = cn(compact ? "text-[10px]" : "text-xs", "mt-0.5");
  if (error) return <p className={cn(cls, "text-destructive")}>This field is required</p>;
  if (helper) return <p className={cn(cls, "text-muted-foreground/70")}>{helper}</p>;
  return null;
}

function SectionHeading({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn("border-b border-border pb-1", compact ? "mt-4 mb-2" : "mt-6 mb-3")}>
      <span
        className={cn(
          "font-bold uppercase tracking-[0.18em] text-muted-foreground/60",
          compact ? "text-[9px]" : "text-[10px]",
        )}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function LandingPageGenerator({
  clientId,
  layout = "embedded",
}: {
  clientId: string;
  layout?: "embedded" | "fullpage";
}) {
  const compact = layout === "embedded";
  const previewMinHeight = compact ? "420px" : "700px";
  const iframeHeight = compact ? "h-[500px]" : "h-[700px]";
  const inputCls = compact ? "h-8 text-xs" : "";
  const ctaLabel = layout === "fullpage" ? "Submit for Review" : "Generate Pages";
  const ctaIcon = layout === "fullpage" ? Send : Sparkles;

  const { palette } = useStudio();
  const { welcomeInfo } = useOnboardingCtx();

  const [form, setForm] = useState<LandingPageFormState>(DEFAULT_FORM);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<GeneratedPages | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [attempted, setAttempted] = useState(false);

  /* ── Pre-fill on mount ── */
  useEffect(() => {
    (async () => {
      const { data: clientData } = await supabase
        .from("clients")
        .select("primary_contact_email")
        .eq("id", clientId)
        .maybeSingle();

      const clientName = welcomeInfo?.clientName ?? "";
      setForm((prev) => ({
        ...prev,
        legalCompanyName: clientName,
        brandName: clientName,
        supportEmail: clientData?.primary_contact_email ?? "",
        brandPrimaryColor: rgbaToHex(palette.primary, "#6366f1"),
        brandAccentColor: rgbaToHex(palette.secondary, "#8b5cf6"),
      }));
      setInitializing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  /* ── Sync clientName once welcomeInfo arrives (may lag behind mount) ── */
  useEffect(() => {
    if (!welcomeInfo?.clientName) return;
    setForm((prev) => ({
      ...prev,
      legalCompanyName: prev.legalCompanyName || welcomeInfo.clientName,
      brandName: prev.brandName || welcomeInfo.clientName,
    }));
  }, [welcomeInfo?.clientName]);

  /* ── Auto-populate RG helplines on jurisdiction change ── */
  useEffect(() => {
    if (!form.licenseJurisdiction) return;
    setForm((prev) => ({
      ...prev,
      rgHelplines: RG_HELPLINES[form.licenseJurisdiction] ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.licenseJurisdiction]);

  /* ── Derived ── */
  const isValid = REQUIRED_FIELDS.every((f) => form[f].trim() !== "") && logoUrl !== null;
  const isInvalid = (f: keyof LandingPageFormState) =>
    attempted && REQUIRED_FIELDS.includes(f) && form[f].trim() === "";

  const set = (f: keyof LandingPageFormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }));
  const onChange =
    (f: keyof LandingPageFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(f)(e.target.value);

  const handleGenerate = async () => {
    setAttempted(true);
    if (!isValid) return;

    setGenerating(true);
    setGenError(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-landing-pages", {
        body: {
          legalCompanyName: form.legalCompanyName,
          brandName: form.brandName,
          primaryDomain: form.primaryDomain,
          platformSubdomain: form.platformSubdomain || undefined,
          supportEmail: form.supportEmail,
          supportHelpline: form.supportHelpline || undefined,
          licenseJurisdiction: form.licenseJurisdiction,
          licenseNumber: form.licenseNumber || undefined,
          rgHelplines: form.rgHelplines || undefined,
          brandPrimaryColor: form.brandPrimaryColor,
          brandAccentColor: form.brandAccentColor || undefined,
          brandLogoUrl: logoUrl!,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.pages) throw new Error("No pages returned from generation");

      setPages(data.pages as GeneratedPages);
      toast.success("Pages generated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGenError(msg);
      toast.error(`Generation failed: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  /* ── Render helpers (close over state so no prop drilling) ── */

  const renderFormSections = () => (
    <>
      {/* Company Info */}
      <SectionHeading compact={compact}>Company Info</SectionHeading>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-legal" required compact={compact}>Legal company name</FieldLabel>
          <Input id="lpg-legal" value={form.legalCompanyName} onChange={onChange("legalCompanyName")}
            placeholder="Scorama Limited" className={inputCls} disabled={generating} />
          <FieldHelper error={isInvalid("legalCompanyName")} compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-brand" required compact={compact}>Public brand name</FieldLabel>
          <Input id="lpg-brand" value={form.brandName} onChange={onChange("brandName")}
            placeholder="Scorama" className={inputCls} disabled={generating} />
          <FieldHelper error={isInvalid("brandName")} compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-domain" required compact={compact}>Primary domain</FieldLabel>
          <Input id="lpg-domain" value={form.primaryDomain} onChange={onChange("primaryDomain")}
            placeholder="scorama.com" className={inputCls} disabled={generating} />
          <FieldHelper error={isInvalid("primaryDomain")}
            helper="The domain where your landing page will be hosted" compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-sub" compact={compact}>Platform subdomain</FieldLabel>
          <Input id="lpg-sub" value={form.platformSubdomain} onChange={onChange("platformSubdomain")}
            placeholder="play.scorama.com" className={inputCls} disabled={generating} />
          <FieldHelper helper="Where the betting app lives. Landing page links will point here." compact={compact} />
        </div>
      </div>

      {/* Support */}
      <SectionHeading compact={compact}>Support</SectionHeading>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-email" required compact={compact}>Support email</FieldLabel>
          <Input id="lpg-email" type="email" value={form.supportEmail} onChange={onChange("supportEmail")}
            placeholder="support@scorama.com" className={inputCls} disabled={generating} />
          <FieldHelper error={isInvalid("supportEmail")} compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-phone" compact={compact}>Support helpline</FieldLabel>
          <Input id="lpg-phone" value={form.supportHelpline} onChange={onChange("supportHelpline")}
            placeholder="+234 800 123 4567" className={inputCls} disabled={generating} />
        </div>
      </div>

      {/* Legal */}
      <SectionHeading compact={compact}>Legal</SectionHeading>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-jur" required compact={compact}>License jurisdiction</FieldLabel>
          <Select value={form.licenseJurisdiction} onValueChange={set("licenseJurisdiction")} disabled={generating}>
            <SelectTrigger id="lpg-jur" className={inputCls}>
              <SelectValue placeholder="Select jurisdiction…" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j} value={j} className={compact ? "text-xs" : undefined}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHelper error={isInvalid("licenseJurisdiction")} compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-lic" compact={compact}>License number</FieldLabel>
          <Input id="lpg-lic" value={form.licenseNumber} onChange={onChange("licenseNumber")}
            placeholder="00123456" className={inputCls} disabled={generating} />
          <FieldHelper helper="Your operating license number, if assigned" compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-rg" compact={compact}>Responsible gambling helplines</FieldLabel>
          <Textarea id="lpg-rg" value={form.rgHelplines} onChange={onChange("rgHelplines")}
            placeholder="Auto-populated when jurisdiction is selected"
            className={cn("resize-none", compact ? "text-xs min-h-[72px]" : "min-h-[96px]")}
            disabled={generating} />
          <FieldHelper helper="Local problem gambling support resources. Auto-filled based on jurisdiction." compact={compact} />
        </div>
      </div>

      {/* Visuals */}
      <SectionHeading compact={compact}>Visuals</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-pc" required compact={compact}>Primary color</FieldLabel>
          <div className="flex items-center gap-2">
            <input type="color" id="lpg-pc" value={form.brandPrimaryColor}
              onChange={onChange("brandPrimaryColor")}
              disabled={generating}
              className={cn("cursor-pointer rounded border border-border bg-transparent p-0.5 w-10", compact ? "h-8" : "h-9")} />
            <Input value={form.brandPrimaryColor} onChange={onChange("brandPrimaryColor")}
              placeholder="#6366f1" className={cn("flex-1 font-mono", inputCls)} maxLength={7} disabled={generating} />
          </div>
          <FieldHelper error={isInvalid("brandPrimaryColor")} compact={compact} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="lpg-ac" compact={compact}>Accent color</FieldLabel>
          <div className="flex items-center gap-2">
            <input type="color" id="lpg-ac" value={form.brandAccentColor}
              onChange={onChange("brandAccentColor")}
              disabled={generating}
              className={cn("cursor-pointer rounded border border-border bg-transparent p-0.5 w-10", compact ? "h-8" : "h-9")} />
            <Input value={form.brandAccentColor} onChange={onChange("brandAccentColor")}
              placeholder="#8b5cf6" className={cn("flex-1 font-mono", inputCls)} maxLength={7} disabled={generating} />
          </div>
        </div>
      </div>

      {/* Brand Logo */}
      <SectionHeading compact={compact}>Brand Logo</SectionHeading>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="lpg-logo" required compact={compact}>Logo file</FieldLabel>
        <LogoUploadField
          clientId={clientId}
          currentLogoUrl={logoUrl}
          onUploadComplete={(url) => setLogoUrl(url)}
          onRemove={() => setLogoUrl(null)}
          disabled={generating}
        />
        {attempted && logoUrl === null && (
          <p className={cn(compact ? "text-[10px]" : "text-xs", "text-destructive mt-0.5")}>
            A logo is required
          </p>
        )}
        <p className={cn("text-muted-foreground/70", compact ? "text-[10px]" : "text-xs")}>
          Appears in the header of all 4 generated pages.
        </p>
      </div>
    </>
  );

  const renderActionButtons = () => {
    const CtaIcon = ctaIcon;
    return (
      <div className={cn("flex flex-col gap-2", compact ? "mt-5" : "mt-6")}>
        {genError && (
          <Alert variant="destructive" className="mb-1">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation failed</AlertTitle>
            <AlertDescription>{genError}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button
            size={compact ? "sm" : "default"}
            className="flex-1 gap-1.5"
            disabled={generating || (attempted && !isValid)}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2 className={cn("animate-spin", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                Generating...
              </>
            ) : (
              <>
                <CtaIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                {ctaLabel}
              </>
            )}
          </Button>
          <Button
            size={compact ? "sm" : "default"}
            variant="outline"
            disabled={generating}
            onClick={() => toast.info("Draft saving coming soon")}
          >
            Save Draft
          </Button>
        </div>
        {attempted && !isValid && !generating && (
          <p className={cn("text-destructive", compact ? "text-[10px]" : "text-xs")}>
            Please fill in all required fields before generating.
          </p>
        )}
        {layout === "fullpage" && (
          <p className="text-xs text-muted-foreground/60 text-center mt-2">
            Once submitted, Trivelta will deploy these pages to your domain.
          </p>
        )}
      </div>
    );
  };

  const renderPreviewTabs = () => (
    <div>
      {generating && (
        <div className={cn(
          "flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3",
          compact ? "mb-3 text-xs" : "mb-4 text-sm",
        )}>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <span className="text-foreground/80">
            Claude is generating your pages…{" "}
            <span className="text-muted-foreground/70">(up to 30 seconds)</span>
          </span>
        </div>
      )}
      <Tabs defaultValue="landing">
        <TabsList className={cn("w-full", compact ? "h-8 mb-3" : "h-10 mb-4")}>
          <TabsTrigger value="landing" className={cn("flex-1", compact ? "text-[11px]" : "text-sm")}>
            Landing
          </TabsTrigger>
          <TabsTrigger value="terms" className={cn("flex-1", compact ? "text-[11px]" : "text-sm")}>
            Terms
          </TabsTrigger>
          <TabsTrigger value="privacy" className={cn("flex-1", compact ? "text-[11px]" : "text-sm")}>
            Privacy
          </TabsTrigger>
          <TabsTrigger value="rg" className={cn("flex-1", compact ? "text-[11px]" : "text-sm")}>
            {compact ? "Resp. Gambling" : "Responsible Gambling"}
          </TabsTrigger>
        </TabsList>

        {(
          [
            { key: "landing", page: pages?.index ?? null, label: "landing" },
            { key: "terms", page: pages?.terms ?? null, label: "Terms & Conditions" },
            { key: "privacy", page: pages?.privacy ?? null, label: "Privacy Policy" },
            { key: "rg", page: pages?.rg ?? null, label: "Responsible Gambling" },
          ] as const
        ).map(({ key, page, label }) => (
          <TabsContent key={key} value={key}>
            {page ? (
              <iframe
                srcDoc={page}
                className={cn("w-full rounded-lg border-0 bg-white", iframeHeight)}
                sandbox="allow-same-origin"
                title={`${label} preview`}
              />
            ) : (
              <EmptyPreview label={label} minHeight={previewMinHeight} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  /* ── Loading ── */

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── Embedded layout ── */

  if (layout === "embedded") {
    return (
      <div className="px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form column — scrollable */}
          <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-2 pb-4">
            {renderFormSections()}
            {renderActionButtons()}
          </div>
          {/* Preview column — sticky */}
          <div className="lg:sticky lg:top-0 pb-4">
            {renderPreviewTabs()}
          </div>
        </div>
      </div>
    );
  }

  /* ── Full-page layout ── */

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Landing Pages</h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
          Generate AI-powered landing, terms, privacy, and responsible gambling pages for your
          brand. Preview below, then submit to Trivelta for deployment.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-1">
          {renderFormSections()}
          {renderActionButtons()}
        </div>
        {/* Preview — 3 cols */}
        <div className="lg:col-span-3">
          {renderPreviewTabs()}
        </div>
      </div>
    </div>
  );
}
