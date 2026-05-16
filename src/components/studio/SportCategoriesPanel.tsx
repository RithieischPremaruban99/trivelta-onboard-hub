import { useEffect, useRef, useState } from "react";
import { useStudio, type SportCategory } from "@/contexts/StudioContext";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MIN_ENABLED = 3;

function SortableRow({
  cat,
  locked,
  enabledCount,
  onNameChange,
  onToggle,
}: {
  cat: SportCategory;
  locked: boolean;
  enabledCount: number;
  onNameChange: (id: string, name: string) => void;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id, disabled: locked });

  const [draftName, setDraftName] = useState(cat.name);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftName(cat.name);
  }, [cat.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const cannotDisable = cat.enabled && enabledCount <= MIN_ENABLED;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 h-8 px-1.5 rounded-md hover:bg-accent/30",
        !cat.enabled && "opacity-50",
      )}
    >
      <button
        type="button"
        className={cn(
          "shrink-0 grid place-items-center h-6 w-4 text-muted-foreground",
          locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        )}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="shrink-0 text-[14px] w-5 text-center select-none">{cat.emoji}</span>
      <Input
        value={draftName}
        readOnly={locked}
        onChange={(e) => {
          const v = e.target.value;
          setDraftName(v);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => onNameChange(cat.id, v), 300);
        }}
        className="h-8 px-1.5 text-[11px] flex-1 min-w-0 bg-transparent border-transparent hover:border-input focus-visible:border-input" style={{ fontSize: "16px" }}
      />
      <button
        type="button"
        disabled={locked || cannotDisable}
        onClick={() => onToggle(cat.id)}
        title={cannotDisable ? `Min ${MIN_ENABLED} sports must stay enabled` : cat.enabled ? "Hide" : "Show"}
        className={cn(
          "shrink-0 grid place-items-center h-6 w-6 rounded text-muted-foreground hover:text-foreground",
          (locked || cannotDisable) && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
        )}
      >
        {cat.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function SportCategoriesPanel({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { sportCategories, setSportCategories, locked: ctxLocked } = useStudio();
  const locked = ctxLocked || readOnly;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const enabledCount = sportCategories.filter((s) => s.enabled).length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sportCategories.findIndex((s) => s.id === active.id);
    const newIndex = sportCategories.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setSportCategories(arrayMove(sportCategories, oldIndex, newIndex));
  };

  const handleNameChange = (id: string, name: string) => {
    setSportCategories(
      sportCategories.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)),
    );
  };

  const handleToggle = (id: string) => {
    setSportCategories(
      sportCategories.map((s) => {
        if (s.id !== id) return s;
        if (s.enabled && enabledCount <= MIN_ENABLED) return s;
        return { ...s, enabled: !s.enabled };
      }),
    );
  };

  return (
    <div className="px-2 py-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sportCategories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {sportCategories.map((cat) => (
              <SortableRow
                key={cat.id}
                cat={cat}
                locked={locked}
                enabledCount={enabledCount}
                onNameChange={handleNameChange}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="px-2 pt-2 text-[10px] text-muted-foreground/70">
        {enabledCount} of {sportCategories.length} shown · drag ⠿ to reorder
      </div>
    </div>
  );
}
