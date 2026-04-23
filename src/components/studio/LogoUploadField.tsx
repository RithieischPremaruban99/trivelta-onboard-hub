import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadFieldProps {
  clientId: string;
  currentLogoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const VALID_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export function LogoUploadField({
  clientId,
  currentLogoUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
}: LogoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!VALID_TYPES.includes(file.type)) {
      toast.error("Only SVG, PNG, JPEG, or WebP files allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Max 2 MB");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${clientId}/logo-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("landing-page-assets")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("landing-page-assets").getPublicUrl(data.path);

      onUploadComplete(publicUrl);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  /* ── Uploaded state ── */
  if (currentLogoUrl) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-4">
        <div className="flex items-center gap-3">
          <img
            src={currentLogoUrl}
            alt="Brand logo"
            className="h-14 w-14 shrink-0 rounded bg-white/5 object-contain p-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Logo uploaded</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {decodeURIComponent(currentLogoUrl.split("/").pop() ?? "")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={onRemove}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  /* ── Drop zone ── */
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={[
        "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50 border-border"
          : dragOver
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-border hover:border-primary/50",
      ].join(" ")}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Uploading…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">
            Drop your logo here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            SVG, PNG, JPEG or WebP · max 2 MB · transparent background recommended
          </p>
        </div>
      )}
    </div>
  );
}
