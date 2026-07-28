"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
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

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KycFormSectionEditor } from "@/components/landlord/KycFormSectionEditor";
import {
  getKycFormConfig,
  isKycFormCustomized,
  resetKycFormToDefault,
  saveKycFormConfig,
} from "@/lib/kycFormConfigStore";
import { cloneDefaultKycFormSchema } from "@/lib/kycFormDefaultTemplate";
import type { FormSection, KycFormSchema } from "@/types/kycFormBuilder";

interface KycFormBuilderProps {
  landlordId: string;
}

let sectionIdCounter = 0;
function nextSectionId(): string {
  sectionIdCounter += 1;
  return `sec-custom-${Date.now()}-${sectionIdCounter}`;
}

export default function KycFormBuilder({ landlordId }: KycFormBuilderProps) {
  const [schema, setSchema] = useState<KycFormSchema>(() =>
    cloneDefaultKycFormSchema(),
  );
  const [customized, setCustomized] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSchema(getKycFormConfig(landlordId));
    setCustomized(isKycFormCustomized(landlordId));
  }, [landlordId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const persist = (next: KycFormSchema) => {
    setSchema(next);
    saveKycFormConfig(landlordId, next);
    setCustomized(true);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const updateSection = (updated: FormSection) => {
    persist({
      sections: schema.sections.map((s) =>
        s.id === updated.id ? updated : s,
      ),
    });
  };

  const removeSection = (sectionId: string) => {
    persist({
      sections: schema.sections.filter((s) => s.id !== sectionId),
    });
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: nextSectionId(),
      title: "New Section",
      fields: [],
    };
    persist({ sections: [...schema.sections, newSection] });
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = schema.sections.findIndex((s) => s.id === active.id);
    const newIndex = schema.sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persist({ sections: arrayMove(schema.sections, oldIndex, newIndex) });
  };

  const handleReset = () => {
    resetKycFormToDefault(landlordId);
    setSchema(cloneDefaultKycFormSchema());
    setCustomized(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            KYC Form Builder
          </h2>
          <p className="text-sm text-gray-500">
            {customized
              ? "This landlord is using a customized tenant application form."
              : "This landlord is using the default tenant application form."}
            {saved && (
              <span className="ml-2 text-emerald-600 font-medium">Saved</span>
            )}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={!customized}
              className="text-gray-600"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset to Default
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to default form?</AlertDialogTitle>
              <AlertDialogDescription>
                This will discard all customizations and restore this
                landlord&apos;s KYC form to match the generic default
                template. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Reset to Default
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={schema.sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {schema.sections.map((section) => (
              <KycFormSectionEditor
                key={section.id}
                section={section}
                onChange={updateSection}
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" onClick={addSection}>
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Section
      </Button>
    </div>
  );
}
