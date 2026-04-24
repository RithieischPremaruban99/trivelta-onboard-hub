import JSZip from "jszip";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TriveltaLogo } from "@/components/TriveltaLogo";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JURISDICTIONS_BY_REGION, RG_HELPLINES, getJurisdictionMetaByLabel } from "@/lib/jurisdictions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  FileX,
  FolderOpen,
  Shield,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Palette,
  RefreshCw,
  Scale,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import { AccordionSection } from "@/components/studio/AccordionSection";
import { FormField } from "@/components/studio/FormField";
import { LogoUploadField } from "@/components/studio/LogoUploadField";
import { PremiumColorPicker } from "@/components/studio/PremiumColorPicker";
import { useStudioFeatures } from "@/hooks/useStudioFeatures";
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

const FIELD_LABELS: Record<string, string> = {
  legalCompanyName: "Legal company name",
  brandName: "Brand name",
  primaryDomain: "Primary domain",
  supportEmail: "Support email",
  licenseJurisdiction: "License jurisdiction",
  brandPrimaryColor: "Primary color",
  logo: "Brand logo",
};

const FIELD_SECTION: Record<string, { section: string; id: string }> = {
  legalCompanyName: { section: "company", id: "si-legal" },
  brandName: { section: "company", id: "si-brand" },
  primaryDomain: { section: "company", id: "si-domain" },
  supportEmail: { section: "support", id: "si-email" },
  licenseJurisdiction: { section: "legal", id: "si-jur" },
  brandPrimaryColor: { section: "visuals", id: "" },
  logo: { section: "assets", id: "" },
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

/* ── Primitive sub-components ─────────────────────────────────────────────── */

function EmbeddedEmptyPreview({ label, minHeight }: { label: string; minHeight: string }) {
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

function FullpageEmptyPreview() {
  return (
    <div className="flex items-center justify-center h-full min-h-[600px] relative">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md text-center space-y-8">

        {/* Icon cluster */}
        <div className="relative inline-block">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10">
            <Sparkles className="h-11 w-11 text-primary" />
          </div>
          <div className="absolute -top-2 -right-3 h-8 w-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-lg animate-pulse">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-2 -left-3 h-8 w-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-lg animate-pulse" style={{ animationDelay: "0.5s" }}>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="absolute top-1/2 -left-8 -translate-y-1/2 h-8 w-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-lg animate-pulse" style={{ animationDelay: "1s" }}>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Your premium pages
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              in 30 seconds.
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            Fill in your brand details on the left. Our AI generates 4 compliant, beautifully
            designed pages tailored to your jurisdiction.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              30 seconds
            </div>
          </div>
          <div className="h-6 w-px bg-border/40" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI-powered
            </div>
          </div>
          <div className="h-6 w-px bg-border/40" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              4 pages
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PreviewSkeleton({ genStage }: { genStage: string }) {
  return (
    <div
      className={cn(
        "relative flex-1 min-h-[600px] rounded-xl overflow-hidden",
        "bg-background/60 border border-border/40",
      )}
    >
      {/* Fake navbar skeleton */}
      <div className="h-14 border-b border-border/30 flex items-center justify-between px-6 bg-background/40">
        <div className="h-6 w-24 rounded-md bg-muted/40 animate-pulse" />
        <div className="flex gap-4">
          {[12, 14, 10, 13].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-sm bg-muted/30 animate-pulse"
              style={{ width: `${w * 4}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="p-12 space-y-8">
        {/* Country badge */}
        <div className="flex justify-center">
          <div className="h-6 w-36 rounded-full bg-primary/10 animate-pulse" />
        </div>

        {/* Headlines */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-14 w-3/4 rounded-lg bg-muted/40 animate-pulse" />
          <div
            className="h-14 w-1/2 rounded-lg bg-primary/20 animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 flex flex-col items-center">
          <div
            className="h-4 w-2/3 rounded-sm bg-muted/30 animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
          <div
            className="h-4 w-1/2 rounded-sm bg-muted/30 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        {/* CTA buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <div
            className="h-11 w-28 rounded-lg bg-primary/20 animate-pulse"
            style={{ animationDelay: "0.7s" }}
          />
          <div
            className="h-11 w-28 rounded-lg bg-muted/30 animate-pulse"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
      </div>

      {/* AI working pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20">
          <div className="relative h-3 w-3 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <span className="text-[11px] font-medium text-primary whitespace-nowrap">
            {genStage || "AI is generating your pages…"}
          </span>
        </div>
      </div>
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

/* ── Sidebar field styles ─────────────────────────────────────────────────── */

const SI_LABEL = "block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5";
const SI_INPUT = "bg-background/40 border-border/40 hover:border-border/60 focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-200 text-sm placeholder:text-muted-foreground/40";
const SI_HELPER = "text-[11px] text-muted-foreground mt-1.5";

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
  const [downloading, setDownloading] = useState(false);
  const [downloadedAt, setDownloadedAt] = useState<Date | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [attempted, setAttempted] = useState(false);
  const [confirmedUpload, setConfirmedUpload] = useState(false);

  const { features: studioFeatures } = useStudioFeatures(clientId);
  const otherFeaturesEnabled = useMemo(
    () =>
      Object.entries(studioFeatures).some(
        ([key, value]) => key !== "landing_page_generator" && value === true,
      ),
    [studioFeatures],
  );

  // Fullpage-only UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("company");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [genStage, setGenStage] = useState<string>("");

  const toggleSection = (key: string) =>
    setActiveSection((s) => (s === key ? "" : key));

  /* ── Pre-fill on mount ── */
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select("primary_contact_email, landing_pages_submitted_at")
        .eq("id", clientId)
        .maybeSingle();

      // If client has already confirmed upload in a previous session, jump
      // straight to the success screen instead of re-showing the generator.
      if (clientData?.landing_pages_submitted_at) {
        setConfirmedUpload(true);
      }

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

  /* ── Fetch client's Drive folder link ── */
  useEffect(() => {
    supabase
      .from("clients")
      .select("drive_link")
      .eq("id", clientId)
      .single()
      .then(({ data }) => setDriveLink(data?.drive_link ?? null));
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

  /* ── Generation stage text ── */
  useEffect(() => {
    if (!generating) {
      setGenStage("");
      return;
    }
    const stages = [
      { delay: 0, text: "Preparing your brand…" },
      { delay: 3000, text: "Analyzing jurisdiction…" },
      { delay: 7000, text: "Generating landing page…" },
      { delay: 12000, text: "Drafting legal content…" },
      { delay: 18000, text: "Polishing your pages…" },
      { delay: 25000, text: "Almost there…" },
    ];
    const timeouts = stages.map(({ delay, text }) =>
      setTimeout(() => setGenStage(text), delay),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [generating]);

  /* ── Derived ── */
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    for (const f of REQUIRED_FIELDS) {
      if (!form[f].trim()) missing.push(f);
    }
    if (!logoUrl) missing.push("logo");
    return missing;
  }, [form, logoUrl]);

  const canGenerate = missingFields.length === 0;

  const isInvalid = (f: keyof LandingPageFormState) =>
    attempted && REQUIRED_FIELDS.includes(f) && form[f].trim() === "";

  const set = (f: keyof LandingPageFormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }));
  const onChange =
    (f: keyof LandingPageFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(f)(e.target.value);

  const scrollToFirstMissing = () => {
    if (missingFields.length === 0) return;
    const first = missingFields[0];
    const meta = FIELD_SECTION[first];
    if (!meta) return;
    if (!sidebarOpen) setSidebarOpen(true);
    setActiveSection(meta.section);
    if (meta.id) {
      setTimeout(() => {
        const el = document.getElementById(meta.id);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }, 300);
    }
  };

  const handleGenerate = async () => {
    setAttempted(true);
    if (!canGenerate) {
      scrollToFirstMissing();
      return;
    }

    setGenerating(true);
    setGenError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log("[landing-gen] Session present:", !!session);
      console.log("[landing-gen] User ID:", authUser?.id);
      console.log("[landing-gen] User email:", authUser?.email);
      console.log("[landing-gen] Token length:", session?.access_token?.length ?? 0);
      console.log("[landing-gen] Token first 50:", session?.access_token?.substring(0, 50));

      if (!session) {
        throw new Error("Your session has expired. Please refresh the page and try again.");
      }

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

  /* ── Download ZIP ── */

  const handleDownload = async () => {
    if (!pages) return;
    setDownloading(true);

    try {
      const zip = new JSZip();
      zip.file("index.html", pages.index);
      zip.file("terms.html", pages.terms);
      zip.file("privacy.html", pages.privacy);
      zip.file("responsible-gambling.html", pages.rg);
      const dlMeta = getJurisdictionMetaByLabel(form.licenseJurisdiction);
      zip.file(
        "README.md",
        `# ${form.brandName} Landing Pages\n\n` +
          `Generated by Trivelta Suite on ${new Date().toLocaleDateString()}\n` +
          `Jurisdiction: ${form.licenseJurisdiction}\n` +
          `Legal Age: ${dlMeta.legalAge}+\n` +
          `Data Protection Law: ${dlMeta.dataLaw ?? "applicable local law"}\n\n` +
          `## ⚠️ IMPORTANT — LEGAL REVIEW REQUIRED\n\n` +
          `These pages contain AI-generated legal content. Before deploying live:\n\n` +
          `1. **Lawyer review** — Have qualified legal counsel review Terms, Privacy Policy, and RG content\n` +
          `2. **Regulator verification** — Confirm all license numbers and regulator references are accurate\n` +
          `3. **Data protection compliance** — Verify compliance with ${dlMeta.dataLaw ?? "applicable local data protection law"}\n` +
          `4. **RG resources** — Add country-specific self-exclusion schemes and helpline numbers\n` +
          `5. **Age verification** — Ensure ${dlMeta.legalAge}+ enforcement is implemented in your KYC flow\n\n` +
          `Trivelta provides this content as a starting template. Final compliance is your responsibility.\n\n` +
          `## Files\n\n` +
          `- index.html — Landing page\n` +
          `- terms.html — Terms and Conditions\n` +
          `- privacy.html — Privacy Policy\n` +
          `- responsible-gambling.html — Responsible Gambling\n\n` +
          `## Deployment\n\n` +
          `Upload all 4 files to the root of your domain: ${form.primaryDomain}\n\n` +
          `For questions, contact your Trivelta Account Manager.\n`,
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.brandName.toLowerCase().replace(/\s+/g, "-")}-landing-pages-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revoke so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloadedAt(new Date());
      toast.success("Download started");
    } catch (err) {
      console.error("[LandingPageGenerator] ZIP download failed:", err);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  /* ── Embedded render helpers ──────────────────────────────────────────────── */

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
              <SelectGroup>
                <SelectLabel>Africa</SelectLabel>
                {JURISDICTIONS_BY_REGION.africa.map((j) => (
                  <SelectItem key={j.value} value={j.label} className={compact ? "text-xs" : undefined}>{j.label}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>LATAM</SelectLabel>
                {JURISDICTIONS_BY_REGION.latam.map((j) => (
                  <SelectItem key={j.value} value={j.label} className={compact ? "text-xs" : undefined}>{j.label}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>International / Offshore</SelectLabel>
                {JURISDICTIONS_BY_REGION.other.map((j) => (
                  <SelectItem key={j.value} value={j.label} className={compact ? "text-xs" : undefined}>{j.label}</SelectItem>
                ))}
              </SelectGroup>
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
            disabled={generating}
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
        {attempted && !canGenerate && !generating && (
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
            Trivelta AI is generating your pages…{" "}
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
              <EmbeddedEmptyPreview label={label} minHeight={previewMinHeight} />
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

  /* ── Final success screen (post-confirmation) ── */

  if (confirmedUpload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden animate-fade-in">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full blur-[120px]"
            style={{ background: "color-mix(in oklab, oklch(0.72 0.17 152) 10%, transparent)" }}
          />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-96 w-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-10">
          {/* Trivelta AI lockup */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-3xl scale-150 pointer-events-none rounded-full" />
            <TriveltaLogo size="xl" brandSuffix="AI" product="Studio" className="relative" />
          </div>

          {/* Step indicator — both complete */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: "oklch(0.72 0.17 152)" }} />
              <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.17 152)" }}>
                Step 1 complete
              </span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: "oklch(0.72 0.17 152)" }} />
              <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.17 152)" }}>
                Step 2 complete
              </span>
            </div>
          </div>

          {/* Hero headline with gradient */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">All done.</h1>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              Your pages are with Trivelta.
            </h2>
          </div>

          {/* Premium status card */}
          <div className="w-full rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/20 p-6 space-y-5 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom left, color-mix(in oklab, oklch(0.72 0.17 152) 10%, transparent), transparent)",
              }}
            />

            <div className="relative space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-11 w-11 rounded-xl border flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, oklch(0.72 0.17 152) 20%, transparent), color-mix(in oklab, oklch(0.72 0.17 152) 5%, transparent))",
                    borderColor: "color-mix(in oklab, oklch(0.72 0.17 152) 25%, transparent)",
                  }}
                >
                  <FileCheck className="h-5 w-5" style={{ color: "oklch(0.72 0.17 152)" }} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold">Files received</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Your Trivelta team will review and deploy your pages within 2–3 business days.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold">You'll be notified</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    We'll email you the moment your site is live on your domain.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional block: other features OR sign out */}
          {otherFeaturesEnabled ? (
            <div className="w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    More to explore
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-left">
                  Your Trivelta AI Studio access is unlocked.
                </h3>
                <p className="text-sm text-muted-foreground text-left leading-relaxed">
                  Your account manager has enabled additional tools — chat with Trivelta AI,
                  design color palettes, customize animations and more.
                </p>
                <Button
                  size="lg"
                  className="w-full group shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  onClick={() => {
                    window.location.href = `/onboarding/${clientId}/studio`;
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Explore Trivelta AI Studio
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You can close this window now. We'll be in touch as soon as your pages go live.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="w-full max-w-xs"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          )}

          {/* Meta footer */}
          <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground pt-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>Secure session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Powered by Trivelta AI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Embedded layout (unchanged) ── */

  if (layout === "embedded") {
    return (
      <div className="px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-2 pb-4">
            {renderFormSections()}
            {renderActionButtons()}
          </div>
          <div className="lg:sticky lg:top-0 pb-4">
            {renderPreviewTabs()}
          </div>
        </div>
      </div>
    );
  }

  /* ── Full-page layout — collapsible sidebar ── */

  const PAGE_TABS = [
    { key: "landing", page: pages?.index ?? null, label: "Landing" },
    { key: "terms", page: pages?.terms ?? null, label: "Terms" },
    { key: "privacy", page: pages?.privacy ?? null, label: "Privacy" },
    { key: "rg", page: pages?.rg ?? null, label: "Responsible Gambling" },
  ] as const;

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* ── Collapsible sidebar ── */}
      <aside
        className={cn(
          "shrink-0 transition-all duration-300 ease-out border-r border-border/40",
          "bg-gradient-to-b from-card/60 to-card/30 backdrop-blur-sm",
          sidebarOpen ? "w-[420px]" : "w-0 overflow-hidden",
        )}
      >
        <div className="w-[420px] h-full flex flex-col">
          {/* Accordion sections */}
          <div className="flex-1 min-h-0 flex flex-col">

            {/* Company */}
            <AccordionSection
              title="Company"
              icon={<Building />}
              subtitle="Name · Domain · Brand"
              active={activeSection === "company"}
              onClick={() => toggleSection("company")}
            >
              <div className="px-5 py-4 space-y-4">
                <FormField
                  label="Legal company name"
                  required
                  error={isInvalid("legalCompanyName") ? "Required" : undefined}
                >
                  <Input id="si-legal" value={form.legalCompanyName}
                    onChange={onChange("legalCompanyName")} placeholder="Scorama Limited"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
                <FormField
                  label="Public brand name"
                  required
                  error={isInvalid("brandName") ? "Required" : undefined}
                >
                  <Input id="si-brand" value={form.brandName}
                    onChange={onChange("brandName")} placeholder="Scorama"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
                <FormField
                  label="Primary domain"
                  required
                  error={isInvalid("primaryDomain") ? "Required" : undefined}
                  helperText={!isInvalid("primaryDomain") ? "Where your landing page is hosted" : undefined}
                >
                  <Input id="si-domain" value={form.primaryDomain}
                    onChange={onChange("primaryDomain")} placeholder="scorama.com"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
                <FormField
                  label="Platform subdomain"
                  helperText="The betting app URL. CTA buttons will link here."
                >
                  <Input id="si-sub" value={form.platformSubdomain}
                    onChange={onChange("platformSubdomain")} placeholder="play.scorama.com"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
              </div>
            </AccordionSection>

            {/* Support */}
            <AccordionSection
              title="Support"
              icon={<Mail />}
              subtitle="Email · Helpline"
              active={activeSection === "support"}
              onClick={() => toggleSection("support")}
            >
              <div className="px-5 py-4 space-y-4">
                <FormField
                  label="Support email"
                  required
                  error={isInvalid("supportEmail") ? "Required" : undefined}
                >
                  <Input id="si-email" type="email" value={form.supportEmail}
                    onChange={onChange("supportEmail")} placeholder="support@scorama.com"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
                <FormField label="Support helpline">
                  <Input id="si-phone" value={form.supportHelpline}
                    onChange={onChange("supportHelpline")} placeholder="+234 800 123 4567"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
              </div>
            </AccordionSection>

            {/* Legal */}
            <AccordionSection
              title="Legal"
              icon={<Scale />}
              subtitle="Jurisdiction · License · RG"
              active={activeSection === "legal"}
              onClick={() => toggleSection("legal")}
            >
              <div className="px-5 py-4 space-y-4">
                <FormField
                  label="License jurisdiction"
                  required
                  error={isInvalid("licenseJurisdiction") ? "Required" : undefined}
                >
                  <Select value={form.licenseJurisdiction} onValueChange={set("licenseJurisdiction")} disabled={generating}>
                    <SelectTrigger id="si-jur" className={cn(SI_INPUT, "text-sm")}>
                      <SelectValue placeholder="Select jurisdiction…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Africa</SelectLabel>
                        {JURISDICTIONS_BY_REGION.africa.map((j) => (
                          <SelectItem key={j.value} value={j.label}>{j.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>LATAM</SelectLabel>
                        {JURISDICTIONS_BY_REGION.latam.map((j) => (
                          <SelectItem key={j.value} value={j.label}>{j.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>International / Offshore</SelectLabel>
                        {JURISDICTIONS_BY_REGION.other.map((j) => (
                          <SelectItem key={j.value} value={j.label}>{j.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  label="License number"
                  helperText="Your operating license number, if assigned"
                >
                  <Input id="si-lic" value={form.licenseNumber}
                    onChange={onChange("licenseNumber")} placeholder="00123456"
                    className={SI_INPUT} disabled={generating} />
                </FormField>
                <FormField
                  label="RG helplines"
                  helperText="Auto-filled from jurisdiction. Override if needed."
                >
                  <Textarea id="si-rg" value={form.rgHelplines}
                    onChange={onChange("rgHelplines")}
                    placeholder="Auto-populated when jurisdiction is selected"
                    className={cn(SI_INPUT, "resize-none min-h-[88px] text-sm")}
                    disabled={generating} />
                </FormField>
              </div>
            </AccordionSection>

            {/* Visuals */}
            <AccordionSection
              title="Visuals"
              icon={<Palette />}
              subtitle="Colors"
              active={activeSection === "visuals"}
              onClick={() => toggleSection("visuals")}
            >
              <div className="px-5 py-4 space-y-4">
                <PremiumColorPicker
                  label="Primary color"
                  value={form.brandPrimaryColor}
                  onChange={(color) => set("brandPrimaryColor")(color)}
                  required
                  disabled={generating}
                />
                <PremiumColorPicker
                  label="Accent color"
                  value={form.brandAccentColor || form.brandPrimaryColor}
                  onChange={(color) => set("brandAccentColor")(color)}
                  disabled={generating}
                />
              </div>
            </AccordionSection>

            {/* Brand Assets */}
            <AccordionSection
              title="Brand Assets"
              icon={<Sparkles />}
              subtitle="Logo upload"
              active={activeSection === "assets"}
              onClick={() => toggleSection("assets")}
            >
              <div className="px-5 py-4">
                <LogoUploadField
                  clientId={clientId}
                  currentLogoUrl={logoUrl}
                  onUploadComplete={(url) => setLogoUrl(url)}
                  onRemove={() => setLogoUrl(null)}
                  disabled={generating}
                />
                {attempted && logoUrl === null && (
                  <p className={SI_HELPER + " text-destructive mt-2"}>A logo is required</p>
                )}
              </div>
            </AccordionSection>

          </div>

          {/* Action buttons */}
          <div className="shrink-0 p-5 border-t border-border/40 space-y-3">
            {genError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Generation failed</AlertTitle>
                <AlertDescription>{genError}</AlertDescription>
              </Alert>
            )}

            {/* Step 1 — Generate (shown until pages are ready) */}
            {!pages && (
              <Button
                size="lg"
                disabled={generating}
                onClick={handleGenerate}
                className={cn(
                  "w-full relative overflow-hidden transition-all duration-500 group",
                  generating && "cursor-wait",
                  !canGenerate && !generating && "opacity-70",
                )}
              >
                {generating ? (
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="relative h-4 w-4 shrink-0">
                      <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                    </div>
                    <span
                      key={genStage}
                      className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                    >
                      {genStage || "Starting…"}
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Pages
                  </>
                )}
                {canGenerate && !generating && (
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                )}
              </Button>
            )}

            {/* Step 2 — Download + Regenerate (shown after pages are ready) */}
            {pages && (
              <>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing ZIP…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download ZIP
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={generating}
                  onClick={handleGenerate}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>

                {/* Legal disclaimer — mandatory, non-dismissible */}
                {(() => {
                  const lMeta = getJurisdictionMetaByLabel(form.licenseJurisdiction);
                  return (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-foreground">Legal Review Required</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            These pages contain AI-generated legal content for <strong>{form.licenseJurisdiction || "your jurisdiction"}</strong>. Before publishing live, you must:
                          </p>
                          <ul className="space-y-1 mt-1">
                            {[
                              "Have qualified legal counsel review all Terms, Privacy, and RG content",
                              "Verify license number and regulator references are accurate",
                              `Confirm compliance with ${lMeta.dataLaw ?? "applicable data protection law"}`,
                              `Ensure ${lMeta.legalAge}+ age verification is enforced in your KYC flow`,
                            ].map((item) => (
                              <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
                            Trivelta provides this as a starting template only. Compliance with local laws remains your sole responsibility.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Missing fields helper card */}
            {attempted && !canGenerate && !generating && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600/80">
                  Required before generating
                </p>
                <ul className="space-y-1">
                  {missingFields.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-amber-700/80">
                      <span className="h-1 w-1 rounded-full bg-amber-500/70 shrink-0" />
                      {FIELD_LABELS[f] ?? f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground/60 text-center">
              ZIP includes 4 HTML files + deployment README.
            </p>

            {/* Post-download instructions card */}
            {downloadedAt && (
              <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Download complete</CardTitle>
                      <CardDescription className="text-xs">
                        Your ZIP has been saved to your Downloads folder.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-background/50 border border-border/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Next step: Upload to Trivelta
                    </div>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-medium shrink-0 mt-0.5">
                          1
                        </span>
                        <span>Click the button below to open your Trivelta Drive folder</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-medium shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Drag the ZIP from your Downloads into that folder</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-medium shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Your Trivelta team will see it and deploy your pages</span>
                      </li>
                    </ol>
                  </div>

                  {driveLink ? (
                    <Button asChild size="lg" className="w-full">
                      <a href={driveLink} target="_blank" rel="noopener noreferrer">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open Trivelta Drive Folder
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <Alert className="border-amber-500/30 bg-amber-500/5">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertTitle>Drive folder not configured</AlertTitle>
                      <AlertDescription className="text-xs">
                        Please email your ZIP file to your Trivelta Account Manager.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Step 4: Confirm upload */}
                  <div className="mt-2 pt-4 border-t border-border/40">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Step 4: Confirm upload
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                      onClick={async () => {
                        setConfirmedUpload(true);
                        try {
                          // Persist submission timestamp so client doesn't re-see
                          // the generator on next login, and so the Studio route
                          // can auto-promote them to full Studio when other
                          // features get enabled later by the AE.
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          await (supabase as any)
                            .from("clients")
                            .update({ landing_pages_submitted_at: new Date().toISOString() })
                            .eq("id", clientId);
                        } catch (err) {
                          console.warn("[LandingPageGenerator] submission flag failed", err);
                        }
                        try {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          await (supabase as any).rpc("log_client_activity", {
                            p_action: "landing_pages_uploaded_confirmed",
                            p_client_id: clientId,
                            p_details: {},
                          });
                        } catch (err) {
                          console.warn("[LandingPageGenerator] activity log failed", err);
                        }
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      I've uploaded the ZIP to Trivelta Drive
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      Confirm once you've dragged the file into the folder
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </aside>

      {/* ── Sidebar toggle button ── */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        className={cn(
          "absolute top-6 z-10 h-10 w-10",
          "rounded-full bg-card border border-border shadow-md",
          "flex items-center justify-center",
          "hover:bg-primary/10 hover:border-primary/30 transition-all",
          sidebarOpen ? "left-[404px]" : "left-2",
        )}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* ── Main preview area ── */}
      <main className="flex-1 overflow-hidden flex flex-col p-6">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="text-xs text-muted-foreground">
              See how your pages will look. Regenerate to apply changes.
            </p>
          </div>

          {/* Desktop / Mobile toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                previewDevice === "desktop"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                previewDevice === "mobile"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>
        </div>

        {/* Preview content */}
        {generating && !pages ? (
          <PreviewSkeleton genStage={genStage} />
        ) : !pages ? (
          <div className="flex-1 min-h-0">
            <FullpageEmptyPreview />
          </div>
        ) : (
          <>
            {/* Regeneration banner (only when regenerating with existing pages) */}
            {generating && (
              <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-4 shrink-0 text-sm">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <span className="text-foreground/80">
                  Regenerating your pages…{" "}
                  <span className="text-muted-foreground/70">(up to 30 seconds)</span>
                </span>
              </div>
            )}

            {/* Page tabs */}
            <Tabs defaultValue="landing" className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-fit bg-card/50 border border-border/40 shrink-0">
                {PAGE_TABS.map(({ key, label }) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {PAGE_TABS.map(({ key, page, label }) => (
                <TabsContent key={key} value={key} className="flex-1 mt-4 min-h-0">
                  <div
                    className={cn(
                      "h-full border border-border/40 rounded-xl overflow-hidden",
                      "shadow-2xl shadow-primary/5 mx-auto",
                      previewDevice === "mobile" ? "max-w-[390px]" : "max-w-full",
                    )}
                  >
                    <iframe
                      srcDoc={page ?? undefined}
                      className="w-full h-full bg-white border-0"
                      sandbox="allow-same-origin"
                      title={`${label} preview`}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
