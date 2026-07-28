"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import KycFormPreview from "@/components/landlord/KycFormPreview";
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
  landlordName: string;
}

let sectionIdCounter = 0;
function nextSectionId(): string {
  sectionIdCounter += 1;
  return `sec-custom-${Date.now()}-${sectionIdCounter}`;
}

export default function KycFormBuilder({
  landlordId,
  landlordName,
}: KycFormBuilderProps) {
  const router = useRouter();
  const [schema, setSchema] = useState<KycFormSchema>(() =>
    cloneDefaultKycFormSchema(),
  );
  const [wasCustomized, setWasCustomized] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    setSchema(getKycFormConfig(landlordId));
    setWasCustomized(isKycFormCustomized(landlordId));
  }, [landlordId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const updateSection = (updated: FormSection) => {
    setSchema((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === updated.id ? updated : s,
      ),
    }));
  };

  const removeSection = (sectionId: string) => {
    setSchema((prev) => ({
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: nextSectionId(),
      title: "New Section",
      fields: [],
    };
    setSchema((prev) => ({ sections: [...prev.sections, newSection] }));
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSchema((prev) => {
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { sections: arrayMove(prev.sections, oldIndex, newIndex) };
    });
  };

  const handleReset = () => {
    resetKycFormToDefault(landlordId);
    setSchema(cloneDefaultKycFormSchema());
    setWasCustomized(false);
  };

  const handleSaveForm = () => {
    saveKycFormConfig(landlordId, schema);
    setWasCustomized(true);
    toast.success("KYC form updated successfully.");
    router.back();
  };

  if (mode === "preview") {
    return (
      <KycFormPreview
        schema={schema}
        landlordName={landlordName}
        onBackToEditing={() => setMode("edit")}
        onSaveForm={handleSaveForm}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            KYC Form Builder
          </h2>
          <p className="text-sm text-gray-500">
            {wasCustomized
              ? "This landlord is using a customized tenant application form."
              : "This landlord is using the default tenant application form."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={!wasCustomized}
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

          <Button
            type="button"
            onClick={() => setMode("preview")}
            className="bg-[#FF5722] hover:bg-[#E64A19]"
          >
            Done
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm px-5 py-5 space-y-4">
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
      </div>
    </div>
  );
}
