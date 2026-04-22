import { useState } from "react";
import { Info, ExternalLink } from "lucide-react";
import { FIELD_INFO } from "@/lib/field-info";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function FieldInfo({ fieldKey }: { fieldKey: string }) {
  const info = FIELD_INFO[fieldKey];
  const [panelOpen, setPanelOpen] = useState(false);

  // Silent no-op when no info registered — safe to add to every field incrementally
  if (!info) return null;

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => info.learnMore && setPanelOpen(true)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors ml-1.5 shrink-0"
              style={{ cursor: info.learnMore ? "pointer" : "help" }}
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
            {info.learnMore && (
              <p className="mt-1 text-[10px] text-muted-foreground">Click for more details →</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {info.learnMore && (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent
            side="right"
            className="w-[420px] sm:w-[500px] flex flex-col gap-0 overflow-y-auto"
          >
            <SheetHeader className="pr-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
                Learn More
              </div>
              <SheetTitle className="text-xl leading-snug">{info.tooltip}</SheetTitle>
              <SheetDescription asChild>
                <div className="text-sm leading-relaxed pt-3 whitespace-pre-line text-foreground/80">
                  {info.learnMore}
                </div>
              </SheetDescription>
            </SheetHeader>

            {info.learnMoreLinks && info.learnMoreLinks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Resources
                </div>
                <div className="flex flex-col gap-2">
                  {info.learnMoreLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
