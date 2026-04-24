import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CopyableLinkProps {
  url: string;
  label?: string;
  /** If provided, shows quick-share shortcuts (Email + Copy with message). */
  clientEmail?: string;
  /** Optional plain-text message template. `{link}` will be replaced with the URL. */
  messageTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
}

export function CopyableLink({
  url,
  label,
  clientEmail,
  messageTemplate,
  emailSubject,
  emailBody,
}: CopyableLinkProps) {
  const [copied, setCopied] = useState(false);

  const writeToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    const ok = await writeToClipboard(url);
    if (ok) {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy. Select the field and use Ctrl+C / Cmd+C");
    }
  };

  const handleEmail = () => {
    if (!clientEmail) return;
    const subject = encodeURIComponent(emailSubject ?? "Your Trivelta onboarding link");
    const body = encodeURIComponent(
      emailBody ??
        `Hi,\n\nClick the link below to start your Trivelta onboarding:\n\n${url}\n\nBest regards,\nThe Trivelta Team`,
    );
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyMessage = async () => {
    const message = (messageTemplate ?? `Hi, here's your Trivelta onboarding link: {link}`).replace(
      "{link}",
      url,
    );
    const ok = await writeToClipboard(message);
    if (ok) toast.success("Pre-formatted message copied");
    else toast.error("Failed to copy");
  };

  const showShortcuts = Boolean(clientEmail || messageTemplate);

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
          className="font-mono text-xs bg-muted/40 cursor-text"
        />
        <Button
          type="button"
          variant={copied ? "secondary" : "default"}
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </Button>
      </div>

      {showShortcuts && (
        <div className="flex flex-wrap gap-2 pt-1">
          {clientEmail && (
            <Button type="button" size="sm" variant="outline" onClick={handleEmail}>
              <Mail className="h-3.5 w-3.5" /> Email to client
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={handleCopyMessage}>
            <MessageSquare className="h-3.5 w-3.5" /> Copy with message
          </Button>
        </div>
      )}
    </div>
  );
}
