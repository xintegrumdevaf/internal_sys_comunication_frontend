import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Mention, MentionTarget } from "@/lib/internal-chat-types";

type Props = {
  open: boolean;
  query: string;
  targets: MentionTarget[];
  onSelect: (mention: Mention) => void;
};

export function MentionPicker({ open, query, targets, onSelect }: Props) {
  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = targets.filter((t) => {
    if (!q) return true;
    return (
      t.label.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      (t.contractId ?? "").toLowerCase().includes(q) ||
      t.targetId.toLowerCase().includes(q)
    );
  });

  const conversations = filtered.filter((t) => t.type === "conversation");
  const customers = filtered.filter((t) => t.type === "customer");

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-md border border-border bg-popover shadow-md overflow-hidden">
      <Command shouldFilter={false}>
        <CommandList className="max-h-56">
          <CommandEmpty>Sin resultados</CommandEmpty>
          {conversations.length > 0 && (
            <CommandGroup heading="Conversaciones">
              {conversations.map((t) => (
                <CommandItem
                  key={`c:${t.targetId}`}
                  value={`${t.label} ${t.targetId}`}
                  onSelect={() =>
                    onSelect({
                      type: "conversation",
                      targetId: t.targetId,
                      label: t.label,
                    })
                  }
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{t.label}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {[t.department, t.status, t.preview].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {customers.length > 0 && (
            <CommandGroup heading="Clientes / contratos">
              {customers.map((t) => (
                <CommandItem
                  key={`u:${t.targetId}`}
                  value={`${t.label} ${t.targetId}`}
                  onSelect={() =>
                    onSelect({
                      type: "customer",
                      targetId: t.targetId,
                      label: t.label,
                    })
                  }
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{t.label}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {[t.department, t.status].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
