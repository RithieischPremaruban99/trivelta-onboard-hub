/**
 * Trivelta icon-only mark (no wordmark). Used in compact UI like loading
 * indicators, chat avatars, and small badges where the full lockup is too heavy.
 *
 * Source: /public/favicon.png (the official square icon mark).
 */
import { cn } from "@/lib/utils";

export function TriveltaIcon({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.png"
      alt="Trivelta"
      draggable={false}
      className={cn("select-none object-contain", className)}
    />
  );
}
