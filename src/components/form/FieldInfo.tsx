import { useState } from "react";
import { Info, ExternalLink, Mail, CheckCircle2, Lightbulb } from "lucide-react";
import { FIELD_INFO } from "@/lib/field-info";
import { getLogoUrl } from "@/lib/logo-url";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export function FieldInfo({ fieldKey }: { fieldKey: string }) {
  const info = FIELD_INFO[fieldKey];
  const [panelOpen, setPanelOpen] = useState(false);

  // Silent no-op when no info registered — safe to add to every field incrementally
  if (!info) return null;

  const hasPanel = !!(info.summary || info.features || info.useCases || info.notes || info.learnMore);

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => hasPanel && setPanelOpen(true)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors ml-1.5 shrink-0"
              style={{ cursor: hasPanel ? "pointer" : "help" }}
              aria-label="More info about this field"
            >
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs text-xs bg-card border border-border text-foreground shadow-xl"
          >
            <p className="leading-relaxed">{info.tooltip}</p>
            {hasPanel && (
              <p className="mt-1 text-[10px] text-muted-foreground">Click for more details →</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {hasPanel && (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent
            side="right"
            className="w-[420px] sm:w-[500px] p-0 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-border/40 px-6 py-5 shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
                Learn More
              </div>
              <h3 className="text-xl font-semibold leading-tight text-foreground">
                {info.tooltip}
              </h3>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Summary */}
              {(info.summary || info.learnMore) && (
                <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                  {info.summary ?? info.learnMore}
                </p>
              )}

              {/* Features */}
              {info.features && info.features.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                    Key Features
                  </div>
                  <div className="space-y-2">
                    {info.features.map((f) => (
                      <div
                        key={f.title}
                        className="rounded-lg border border-border/40 bg-card/30 px-4 py-3"
                      >
                        <div className="text-xs font-semibold text-foreground mb-0.5">{f.title}</div>
                        <div className="text-xs text-foreground/70 leading-relaxed">{f.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Use cases */}
              {info.useCases && info.useCases.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                    Common Uses
                  </div>
                  <ul className="space-y-1.5">
                    {info.useCases.map((uc) => (
                      <li key={uc} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-xs text-foreground/80 leading-relaxed">{uc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {info.notes && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs italic text-foreground/75 leading-relaxed">{info.notes}</p>
                </div>
              )}


              {/* Providers / Resources */}
              {info.learnMoreLinks && info.learnMoreLinks.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                    {info.learnMoreLinks.length > 1 ? "Providers" : "Resource"}
                  </div>

                  <div
                    className={cn(
                      "gap-2",
                      info.learnMoreLinks.length > 3
                        ? "grid grid-cols-2"
                        : "flex flex-col",
                    )}
                  >
                    {info.learnMoreLinks.map((link) => {
                      const isMail = link.url.startsWith("mailto:");
                      const logo = !isMail ? getLogoUrl(link.url) : null;

                      return (
                        <a
                          key={link.url}
                          href={link.url}
                          target={isMail ? "_self" : "_blank"}
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 hover:border-primary/40 hover:bg-card/60 transition-all"
                        >
                          {/* Logo, Mail icon, or monogram fallback */}
                          {isMail ? (
                            <div className="h-8 w-8 rounded-md bg-primary/10 grid place-items-center shrink-0">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                          ) : logo ? (
                            <img
                              src={logo}
                              alt=""
                              referrerPolicy="origin"
                              className="h-8 w-8 rounded-md bg-white/5 object-contain p-1 shrink-0"
                              onError={(e) => {
                                const el = e.currentTarget;
                                const parent = el.parentElement;
                                if (parent) {
                                  const monogram = document.createElement("div");
                                  monogram.className =
                                    "h-8 w-8 rounded-md bg-primary/10 grid place-items-center shrink-0 text-xs font-semibold text-primary";
                                  monogram.textContent = link.label.charAt(0).toUpperCase();
                                  parent.replaceChild(monogram, el);
                                }
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-primary/10 grid place-items-center shrink-0 text-xs font-semibold text-primary">
                              {link.label.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Label */}
                          <span className="flex-1 text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {link.label}
                          </span>

                          {/* Arrow indicator */}
                          <ExternalLink className="h-3 w-3 text-muted-foreground/60 shrink-0 group-hover:text-primary transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
