import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { buildClientPDF } from "@/lib/pdf-builder";
import type { FormShape } from "@/lib/onboarding-schema";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  Image,
  Loader2,
  MessageSquare,
  Palette,
  Sparkles,
} from "lucide-react";
import { StageHeader } from "@/components/StageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/$clientId/studio-unlocked")({
  component: StudioUnlockedPage,
});

function StudioUnlockedPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio-unlocked" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [pdfData, setPdfData] = useState<{
    clientName: string;
    contactEmail: string;
    submittedAt: string;
    form: FormShape;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const [formRes, clientRes] = await Promise.all([
        supabase
          .from("onboarding_forms")
          .select("data, submitted_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase
          .from("clients")
          .select("studio_access, name, primary_contact_email")
          .eq("id", clientId)
          .maybeSingle(),
      ]);
      if (!formRes.data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }
      if (!clientRes.data?.studio_access) {
        navigate({ to: "/onboarding/$clientId/success", params: { clientId }, replace: true });
        return;
      }
      setPdfData({
        clientName: clientRes.data.name ?? "Client",
        contactEmail: clientRes.data.primary_contact_email ?? "",
        submittedAt: formRes.data.submitted_at,
        form: formRes.data.data as FormShape,
      });
      setVerified(true);
    })();
  }, [user, authLoading, clientId]);

  if (authLoading || !verified) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const features = [
    { icon: MessageSquare, label: "AI Chat", desc: "Describe your brand, get a full palette" },
    { icon: Palette, label: "344 Colors", desc: "Every visual detail, semantically aware" },
    { icon: Image, label: "Logo Studio", desc: "3 unique variants, generated on demand" },
    { icon: Eye, label: "Live Preview", desc: "See your platform in mobile and web" },
  ] as const;

  return (
    <div className="min-h-screen bg-background relative">
      <StageHeader stage="ONBOARDING" />
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_60%)] pointer-events-none" />
      <div
        className="fixed top-1/3 right-1/4 h-96 w-96 rounded-full bg-primary/15 blur-[120px] animate-pulse pointer-events-none"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="fixed bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[100px] animate-pulse pointer-events-none"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">

          {/* Success indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 grid place-items-center">
                <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary grid place-items-center shadow-lg">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Micro-label */}
          <div className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
            FORM SUBMITTED · STUDIO UNLOCKED
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl md:text-[52px] font-bold tracking-tight mb-4 leading-[1.05]">
            Your onboarding is in.<br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              Now design your platform.
            </span>
          </h1>

          <p className="text-center text-base text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            The Trivelta team received your setup information. While we review and prepare your
            platform, jump into Studio and design the brand your users will see.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group rounded-xl border border-border/40 bg-card/30 p-4 backdrop-blur-md hover:border-primary/30 hover:bg-card/50 transition-all hover:-translate-y-1"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xs font-semibold text-foreground mb-1">{label}</div>
                <div className="text-[10px] text-muted-foreground/70 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() =>
                navigate({ to: "/onboarding/$clientId/studio-intro", params: { clientId } })
              }
              className="group inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-7 py-4 text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Enter Trivelta Studio
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              I'll do this later
            </button>

            {pdfData && (
              <button
                onClick={() => {
                  try {
                    const doc = buildClientPDF(
                      {
                        name: pdfData.clientName,
                        primary_contact_email: pdfData.contactEmail,
                        submitted_at: pdfData.submittedAt,
                      },
                      pdfData.form,
                    );
                    const safeName = pdfData.clientName.replace(/\s+/g, "-").toLowerCase();
                    doc.save(`${safeName}-onboarding-${new Date().toISOString().split("T")[0]}.pdf`);
                  } catch (err) {
                    console.error("[PDF] client generation failed:", err);
                    toast.error("Could not generate PDF. Please try again.");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 backdrop-blur-md px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-card/50 hover:border-primary/30 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download Submission Summary (PDF)
              </button>
            )}
          </div>

          {/* Footer hint */}
          <div className="mt-12 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              Your design auto-saves. You can return anytime from your dashboard.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
