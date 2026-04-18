import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AmLite {
  user_id: string;
  email: string;
  name: string | null;
}

function initials(am: AmLite): string {
  const source = am.name?.trim() || am.email;
  const parts = source.split(/\s+|[._-]/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || source[0]?.toUpperCase() || "?";
}

export function AmAvatars({ ams, max = 4 }: { ams: AmLite[]; max?: number }) {
  if (ams.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const visible = ams.slice(0, max);
  const overflow = ams.length - visible.length;
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex -space-x-2">
        {visible.map((am) => (
          <Tooltip key={am.user_id}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 ring-2 ring-background">
                <AvatarFallback className="text-[10px] font-medium bg-primary/15 text-primary">
                  {initials(am)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{am.name ?? am.email}</TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Avatar className="h-7 w-7 ring-2 ring-background">
            <AvatarFallback className="text-[10px] font-medium bg-secondary text-muted-foreground">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </TooltipProvider>
  );
}
