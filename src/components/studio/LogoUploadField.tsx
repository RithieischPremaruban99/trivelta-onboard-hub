import { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon } from "lucide-react";
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

// JPEG excluded — no transparency support
const VALID_TYPES = ["image/svg+xml", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIN_DIMENSION = 500;

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

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
      toast.error("Only SVG, PNG, or WebP files are allowed. JPEG and GIF are not supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Maximum 2MB.");
      return;
    }
    if (file.type !== "image/svg+xml") {
      const dims = await getImageDimensions(file);
      if (dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
        toast.error(
          `Image too small (${dims.width}×${dims.height}px). Minimum ${MIN_DIMENSION}×${MIN_DIMENSION} pixels required for quality.`,
        );
        return;
      }
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

  return (
    <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/60 to-card/20 p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ImageIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold">Brand Logo</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Appears on all landing pages
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-lg bg-background/50 border border-border/30 p-3 mb-4 space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Requirements
        </div>
        {[
          { ok: true, text: "SVG preferred (scalable, crisp)" },
          { ok: true, text: "PNG or WebP with transparent background" },
          { ok: true, text: "Minimum 500×500 pixels (for PNG/WebP)" },
          { ok: true, text: "Maximum 2MB file size" },
          { ok: false, text: "No JPEG (no transparency support)" },
        ].map(({ ok, text }) => (
          <div key={text} className="flex items-center gap-2 text-[11px]">
            {ok ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-red-400 shrink-0" />
            )}
            <span className={ok ? "" : "text-muted-foreground"}>{text}</span>
          </div>
        ))}
      </div>

      {/* Upload area or preview */}
      {currentLogoUrl ? (
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
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={[
            "rounded-lg border-2 border-dashed p-6 text-center transition-all",
            disabled
              ? "cursor-not-allowed opacity-50 border-border"
              : dragOver
                ? "cursor-pointer border-primary bg-primary/5"
                : "cursor-pointer border-border/60 hover:border-primary/50 hover:bg-primary/[0.02]",
          ].join(" ")}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/webp"
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
              <Upload className="h-7 w-7 text-muted-foreground/60" />
              <p className="text-sm font-medium">Drop logo here or click to browse</p>
              <p className="text-[11px] text-muted-foreground">SVG · PNG · WebP · max 2MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
