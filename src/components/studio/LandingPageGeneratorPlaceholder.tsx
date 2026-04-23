import { FileText } from "lucide-react";

export function LandingPageGeneratorPlaceholder() {
  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Landing Page Generator</h3>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
        AI-powered generation of landing, terms, privacy, and responsible gambling pages for your
        brand.
      </p>
      <p className="mt-4 text-[10px] text-muted-foreground/50 italic">Coming soon</p>
    </div>
  );
}
