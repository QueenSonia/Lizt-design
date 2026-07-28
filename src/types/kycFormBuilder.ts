export type FormFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "multi_select"
  | "file_upload"
  | "address";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  phone: "Phone Number",
  number: "Number",
  date: "Date",
  dropdown: "Dropdown",
  radio: "Radio Buttons",
  checkbox: "Checkbox",
  multi_select: "Multi Select",
  file_upload: "File Upload",
  address: "Address",
};

export const FIELD_TYPES_WITH_OPTIONS: FormFieldType[] = [
  "dropdown",
  "radio",
  "multi_select",
];

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface KycFormSchema {
  sections: FormSection[];
}
