import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  required,
  helperText,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 group">
      <label
        className={cn(
          "text-[11px] uppercase tracking-wider font-semibold transition-colors duration-200",
          "text-muted-foreground group-focus-within:text-primary",
        )}
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <div className="relative">{children}</div>
      {error ? (
        <p className="text-[11px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-muted-foreground/70">{helperText}</p>
      ) : null}
    </div>
  );
}
