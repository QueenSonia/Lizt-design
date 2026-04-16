/**
 * Step definitions for the multi-step KYC form
 * Requirements: 1.1, 1.2
 *
 */

import { Step } from "../types";

export const FORM_STEPS: Step[] = [
  {
    number: 1,
    title: "Personal Details",
    subtitle: "Tell us about yourself and your emergency contact",
  },
  {
    number: 2,
    title: "Employment Details",
    subtitle: "Tell us about your work and income",
  },
  {
    number: 3,
    title: "Tenancy Information",
    subtitle: "Tell us about your rental requirements",
  },
  {
    number: 4,
    title: "Identification & Declaration",
    subtitle: "Upload your documents and confirm details",
  },
];

export const TOTAL_STEPS = FORM_STEPS.length; // 4 steps

export const STEP_TITLES = FORM_STEPS.reduce((acc, step) => {
  acc[step.number] = step.title;
  return acc;
}, {} as Record<number, string>);

export const STEP_SUBTITLES = FORM_STEPS.reduce((acc, step) => {
  acc[step.number] = step.subtitle;
  return acc;
}, {} as Record<number, string>);
