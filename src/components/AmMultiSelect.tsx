import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AmLite } from "@/components/AmAvatars";

function initials(am: AmLite): string {
  const source = am.name?.trim() || am.email;
  const parts = source.split(/\s+|[._-]/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || source[0]?.toUpperCase() || "?";
}

export function AmMultiSelect({
  ams,
  value,
  onChange,
  placeholder = "Select account managers",
}: {
  ams: AmLite[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = ams.filter((a) => value.includes(a.email));

  const toggle = (email: string) => {
    if (value.includes(email)) onChange(value.filter((v) => v !== email));
    else onChange([...value, email]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((a) => (
                <Badge key={a.email} variant="secondary" className="gap-1 pl-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] font-medium bg-primary/15 text-primary">
                      {initials(a)}
                    </AvatarFallback>
                  </Avatar>
                  {a.name ?? a.email}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(a.email);
                    }}
                    className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search account managers..." />
          <CommandList>
            <CommandEmpty>No account managers found.</CommandEmpty>
            <CommandGroup>
              {ams.map((a) => {
                const isSelected = value.includes(a.email);
                return (
                  <CommandItem key={a.email} value={a.name ?? a.email} onSelect={() => toggle(a.email)}>
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <Avatar className="h-7 w-7 mr-2">
                      <AvatarFallback className="text-[10px] font-medium bg-primary/15 text-primary">
                        {initials(a)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{a.name ?? a.email}</span>
                      {a.name && <span className="text-xs text-muted-foreground">{a.email}</span>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
