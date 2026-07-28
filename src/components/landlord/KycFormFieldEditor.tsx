"use client";

import { useState } from "react";
import { GripVertical, Trash2, Plus, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FIELD_TYPES_WITH_OPTIONS,
  FIELD_TYPE_LABELS,
  type FormField,
  type FormFieldType,
} from "@/types/kycFormBuilder";

interface KycFormFieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
}

export function KycFormFieldEditor({
  field,
  onChange,
  onRemove,
}: KycFormFieldEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });
  const [newOption, setNewOption] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type);

  const addOption = () => {
    const value = newOption.trim();
    if (!value) return;
    onChange({ ...field, options: [...(field.options ?? []), value] });
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    onChange({
      ...field,
      options: (field.options ?? []).filter((_, i) => i !== idx),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-gray-200 bg-white p-5 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          aria-label="Drag to reorder field"
          className="mt-2 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col xl:flex-row gap-4">
            <Input
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              placeholder="Field label"
              className="text-sm flex-1"
            />
            <Select
              value={field.type}
              onValueChange={(value) =>
                onChange({ ...field, type: value as FormFieldType })
              }
            >
              <SelectTrigger className="w-full xl:w-56 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showOptions && (
            <div className="space-y-2 pl-1">
              {(field.options ?? []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 flex-1 border border-gray-200 rounded px-3 py-2">
                    {opt}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label={`Remove option ${opt}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Add option"
                  className="text-xs h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={addOption}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-3 text-xs text-gray-600">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) =>
                  onChange({ ...field, required: checked })
                }
              />
              {field.required ? "Required" : "Optional"}
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500"
              aria-label={`Remove field ${field.label}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
