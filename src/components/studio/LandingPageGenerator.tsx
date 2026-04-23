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
import { FileX, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  index: string | null;
  terms: string | null;
  privacy: string | null;
  responsibleGambling: string | null;
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
  "Ghana (Gaming Commission of Ghana)":
    "Gamblers Anonymous International\ngamblersanonymous.org",
  "Tanzania (Gaming Board of Tanzania)":
    "Gamblers Anonymous International\ngamblersanonymous.org",
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

const DEFAULT_PAGES: GeneratedPages = {
  index: null,
  terms: null,
  privacy: null,
  responsibleGambling: null,
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

/* ── Sub-components ───────────────────────────────────────────────────────── */

function EmptyPreview({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-dashed border-border p-8 text-center">
      <FileX className="h-10 w-10 text-muted-foreground/40 mb-4" />
      <h3 className="text-sm font-medium text-foreground">No preview yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Fill in the form and click Generate to see your {label} page.
      </p>
    </div>
  );
}

function FormField({
  id,
  label,
  required,
  children,
  helper,
  invalid,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  helper?: string;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {helper && !invalid && (
        <p className="text-[10px] text-muted-foreground/70">{helper}</p>
      )}
      {invalid && (
        <p className="text-[10px] text-destructive">This field is required</p>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-2 border-b border-border pb-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
        {children}
      </span>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function LandingPageGenerator({ clientId }: { clientId: string }) {
  const { palette } = useStudio();
  const { welcomeInfo } = useOnboardingCtx();

  const [form, setForm] = useState<LandingPageFormState>(DEFAULT_FORM);
  const [generatedPages] = useState<GeneratedPages>(DEFAULT_PAGES);
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
      const primaryColor = rgbaToHex(palette.primary, "#6366f1");
      const accentColor = rgbaToHex(palette.secondary, "#8b5cf6");

      setForm((prev) => ({
        ...prev,
        legalCompanyName: clientName,
        brandName: clientName,
        supportEmail: clientData?.primary_contact_email ?? "",
        brandPrimaryColor: primaryColor,
        brandAccentColor: accentColor,
      }));
      setInitializing(false);
    })();
    // Run once on mount; welcomeInfo may still be loading — we handle that below
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
    // Only fires on jurisdiction change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.licenseJurisdiction]);

  /* ── Derived ── */
  const isValid = REQUIRED_FIELDS.every((f) => form[f].trim() !== "");

  const isInvalid = (field: keyof LandingPageFormState) =>
    attempted && REQUIRED_FIELDS.includes(field) && form[field].trim() === "";

  const set = (field: keyof LandingPageFormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleInputChange =
    (field: keyof LandingPageFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(field)(e.target.value);

  const handleGenerate = () => {
    setAttempted(true);
    if (!isValid) return;
    toast.info("AI generation coming in Phase 4");
  };

  const handleSaveDraft = () => {
    toast.info("Draft saving coming soon");
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Two-col: form left, preview right. Single-col in narrow panels. */}
      <div className="grid grid-cols-1 2xl:grid-cols-[2fr_3fr] gap-6">

        {/* ── LEFT: Input form ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 pb-4">

          {/* Company Info */}
          <SectionHeading>Company Info</SectionHeading>

          <FormField
            id="lpg-legal-name"
            label="Legal company name"
            required
            invalid={isInvalid("legalCompanyName")}
          >
            <Input
              id="lpg-legal-name"
              value={form.legalCompanyName}
              onChange={handleInputChange("legalCompanyName")}
              placeholder="Scorama Limited"
              className="h-8 text-xs"
            />
          </FormField>

          <FormField
            id="lpg-brand-name"
            label="Public brand name"
            required
            invalid={isInvalid("brandName")}
          >
            <Input
              id="lpg-brand-name"
              value={form.brandName}
              onChange={handleInputChange("brandName")}
              placeholder="Scorama"
              className="h-8 text-xs"
            />
          </FormField>

          <FormField
            id="lpg-domain"
            label="Primary domain"
            required
            helper="The domain where your landing page will be hosted"
            invalid={isInvalid("primaryDomain")}
          >
            <Input
              id="lpg-domain"
              value={form.primaryDomain}
              onChange={handleInputChange("primaryDomain")}
              placeholder="scorama.com"
              className="h-8 text-xs"
            />
          </FormField>

          <FormField
            id="lpg-subdomain"
            label="Platform subdomain"
            helper="Where the actual betting app lives. Landing page links will point here."
          >
            <Input
              id="lpg-subdomain"
              value={form.platformSubdomain}
              onChange={handleInputChange("platformSubdomain")}
              placeholder="play.scorama.com"
              className="h-8 text-xs"
            />
          </FormField>

          {/* Support */}
          <SectionHeading>Support</SectionHeading>

          <FormField
            id="lpg-email"
            label="Support email"
            required
            invalid={isInvalid("supportEmail")}
          >
            <Input
              id="lpg-email"
              type="email"
              value={form.supportEmail}
              onChange={handleInputChange("supportEmail")}
              placeholder="support@scorama.com"
              className="h-8 text-xs"
            />
          </FormField>

          <FormField
            id="lpg-helpline"
            label="Support helpline"
          >
            <Input
              id="lpg-helpline"
              value={form.supportHelpline}
              onChange={handleInputChange("supportHelpline")}
              placeholder="+234 800 123 4567"
              className="h-8 text-xs"
            />
          </FormField>

          {/* Legal */}
          <SectionHeading>Legal</SectionHeading>

          <FormField
            id="lpg-jurisdiction"
            label="License jurisdiction"
            required
            invalid={isInvalid("licenseJurisdiction")}
          >
            <Select
              value={form.licenseJurisdiction}
              onValueChange={set("licenseJurisdiction")}
            >
              <SelectTrigger id="lpg-jurisdiction" className="h-8 text-xs">
                <SelectValue placeholder="Select jurisdiction…" />
              </SelectTrigger>
              <SelectContent>
                {JURISDICTIONS.map((j) => (
                  <SelectItem key={j} value={j} className="text-xs">
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInvalid("licenseJurisdiction") && (
              <p className="text-[10px] text-destructive">This field is required</p>
            )}
          </FormField>

          <FormField
            id="lpg-license-no"
            label="License number"
            helper="Your operating license number, if assigned"
          >
            <Input
              id="lpg-license-no"
              value={form.licenseNumber}
              onChange={handleInputChange("licenseNumber")}
              placeholder="00123456"
              className="h-8 text-xs"
            />
          </FormField>

          <FormField
            id="lpg-rg"
            label="Responsible gambling helplines"
            helper="Local problem gambling support resources. Auto-filled based on jurisdiction."
          >
            <Textarea
              id="lpg-rg"
              value={form.rgHelplines}
              onChange={handleInputChange("rgHelplines")}
              placeholder="Will auto-populate when jurisdiction is selected"
              className="text-xs min-h-[80px] resize-none"
            />
          </FormField>

          {/* Visuals */}
          <SectionHeading>Visuals</SectionHeading>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="lpg-primary-color"
              label="Primary color"
              required
              invalid={isInvalid("brandPrimaryColor")}
            >
              <div className="flex items-center gap-2">
                <input
                  id="lpg-primary-color"
                  type="color"
                  value={form.brandPrimaryColor}
                  onChange={handleInputChange("brandPrimaryColor")}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <Input
                  value={form.brandPrimaryColor}
                  onChange={handleInputChange("brandPrimaryColor")}
                  placeholder="#6366f1"
                  className="h-8 flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </FormField>

            <FormField id="lpg-accent-color" label="Accent color">
              <div className="flex items-center gap-2">
                <input
                  id="lpg-accent-color"
                  type="color"
                  value={form.brandAccentColor}
                  onChange={handleInputChange("brandAccentColor")}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <Input
                  value={form.brandAccentColor}
                  onChange={handleInputChange("brandAccentColor")}
                  placeholder="#8b5cf6"
                  className="h-8 flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </FormField>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              disabled={attempted && !isValid}
              onClick={handleGenerate}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Pages
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
          </div>

          {attempted && !isValid && (
            <p className="mt-1 text-[10px] text-destructive">
              Please fill in all required fields before generating.
            </p>
          )}
        </div>

        {/* ── RIGHT: Preview tabs ────────────────────────────────────────── */}
        <div className="pb-4">
          <Tabs defaultValue="landing">
            <TabsList className="w-full h-8 mb-3">
              <TabsTrigger value="landing" className="flex-1 text-[11px]">
                Landing
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex-1 text-[11px]">
                Terms
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex-1 text-[11px]">
                Privacy
              </TabsTrigger>
              <TabsTrigger value="rg" className="flex-1 text-[11px]">
                Resp. Gambling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="landing">
              {generatedPages.index ? (
                <iframe
                  srcDoc={generatedPages.index}
                  className="w-full h-[600px] rounded-lg border-0 bg-white"
                  sandbox="allow-same-origin"
                  title="Landing page preview"
                />
              ) : (
                <EmptyPreview label="landing" />
              )}
            </TabsContent>

            <TabsContent value="terms">
              {generatedPages.terms ? (
                <iframe
                  srcDoc={generatedPages.terms}
                  className="w-full h-[600px] rounded-lg border-0 bg-white"
                  sandbox="allow-same-origin"
                  title="Terms & Conditions preview"
                />
              ) : (
                <EmptyPreview label="Terms & Conditions" />
              )}
            </TabsContent>

            <TabsContent value="privacy">
              {generatedPages.privacy ? (
                <iframe
                  srcDoc={generatedPages.privacy}
                  className="w-full h-[600px] rounded-lg border-0 bg-white"
                  sandbox="allow-same-origin"
                  title="Privacy Policy preview"
                />
              ) : (
                <EmptyPreview label="Privacy Policy" />
              )}
            </TabsContent>

            <TabsContent value="rg">
              {generatedPages.responsibleGambling ? (
                <iframe
                  srcDoc={generatedPages.responsibleGambling}
                  className="w-full h-[600px] rounded-lg border-0 bg-white"
                  sandbox="allow-same-origin"
                  title="Responsible Gambling preview"
                />
              ) : (
                <EmptyPreview label="Responsible Gambling" />
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
