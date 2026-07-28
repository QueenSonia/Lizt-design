"use client";

import { useState } from "react";
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KycFormFieldEditor } from "@/components/landlord/KycFormFieldEditor";
import type { FormField, FormSection } from "@/types/kycFormBuilder";

interface KycFormSectionEditorProps {
  section: FormSection;
  onChange: (section: FormSection) => void;
  onRemove: () => void;
}

let fieldIdCounter = 0;
function nextFieldId(): string {
  fieldIdCounter += 1;
  return `f-custom-${Date.now()}-${fieldIdCounter}`;
}

export function KycFormSectionEditor({
  section,
  onChange,
  onRemove,
}: KycFormSectionEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateField = (updated: FormField) => {
    onChange({
      ...section,
      fields: section.fields.map((f) => (f.id === updated.id ? updated : f)),
    });
  };

  const removeField = (fieldId: string) => {
    onChange({
      ...section,
      fields: section.fields.filter((f) => f.id !== fieldId),
    });
  };

  const addField = () => {
    const newField: FormField = {
      id: nextFieldId(),
      type: "short_text",
      label: "New Field",
      required: false,
    };
    onChange({ ...section, fields: [...section.fields, newField] });
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = section.fields.findIndex((f) => f.id === active.id);
    const newIndex = section.fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange({ ...section, fields: arrayMove(section.fields, oldIndex, newIndex) });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-gray-200 bg-gray-50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          aria-label="Drag to reorder section"
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <Input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="text-sm font-semibold flex-1 bg-white"
        />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-400 hover:text-gray-600"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
        >
          {collapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
          aria-label={`Remove section ${section.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFieldDragEnd}
          >
            <SortableContext
              items={section.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {section.fields.map((field) => (
                <KycFormFieldEditor
                  key={field.id}
                  field={field}
                  onChange={updateField}
                  onRemove={() => removeField(field.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {section.fields.length === 0 && (
            <p className="text-xs text-gray-400 italic py-2">
              No fields in this section yet.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addField}
            className="w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}
