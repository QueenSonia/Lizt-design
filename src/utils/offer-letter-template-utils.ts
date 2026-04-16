import type { OfferLetterTemplate } from "../types/offer-letter-template";

/**
 * Appends a new empty term to the end of the template's terms list.
 */
export function addTerm(template: OfferLetterTemplate): OfferLetterTemplate {
  return {
    ...template,
    termsOfTenancy: [
      ...template.termsOfTenancy,
      { title: "New Term", content: "Add your content here" },
    ],
  };
}

/**
 * Converts a term's string content to a bullet-point array (subItems mode).
 * Preserves existing content as the first item.
 */
export function convertTermToSubItems(
  template: OfferLetterTemplate,
  termIndex: number,
): OfferLetterTemplate {
  const terms = template.termsOfTenancy.map((term, i) => {
    if (i !== termIndex || Array.isArray(term.content)) return term;
    return {
      ...term,
      content: [term.content || "Add your first bullet point"],
    };
  });
  return { ...template, termsOfTenancy: terms };
}

/**
 * Removes the term at the given index and returns a new template.
 */
export function removeTerm(
  template: OfferLetterTemplate,
  index: number,
): OfferLetterTemplate {
  return {
    ...template,
    termsOfTenancy: template.termsOfTenancy.filter((_, i) => i !== index),
  };
}

/**
 * Adds an empty sub-item to the term at the given index.
 * If the term's content is a string, it converts it to an array first.
 */
export function addSubItem(
  template: OfferLetterTemplate,
  termIndex: number,
): OfferLetterTemplate {
  const terms = template.termsOfTenancy.map((term, i) => {
    if (i !== termIndex) return term;
    const currentContent = Array.isArray(term.content)
      ? term.content
      : [term.content];
    return { ...term, content: [...currentContent, "New bullet point"] };
  });
  return { ...template, termsOfTenancy: terms };
}

/**
 * Removes a sub-item from a term's array content.
 * If only one item remains after removal, converts content back to a string.
 */
export function removeSubItem(
  template: OfferLetterTemplate,
  termIndex: number,
  subItemIndex: number,
): OfferLetterTemplate {
  const terms = template.termsOfTenancy.map((term, i) => {
    if (i !== termIndex || !Array.isArray(term.content)) return term;
    const newContent = term.content.filter((_, j) => j !== subItemIndex);
    // Convert to string if only one item remains
    if (newContent.length === 1) {
      return { ...term, content: newContent[0] };
    }
    return { ...term, content: newContent };
  });
  return { ...template, termsOfTenancy: terms };
}

/**
 * Data map for placeholder replacement in template merge.
 */
export interface TemplateMergeData {
  propertyName?: string;
  tenantName?: string;
  tenantAddress?: string;
  salutation?: string;
  lastName?: string;
  rentAmount?: string;
  serviceCharge?: string;
  cautionDeposit?: string;
  legalFee?: string;
  agencyFee?: string;
  tenancyTerm?: string;
  tenancyPeriod?: string;
  issuedDate?: string;
}

/**
 * Replaces all `{placeholder}` tokens in the template with actual values from data.
 * Returns a new template with all placeholders resolved.
 */
export function mergeTemplateWithData(
  template: OfferLetterTemplate,
  data: TemplateMergeData,
): OfferLetterTemplate {
  const replacePlaceholders = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      const value = data[key as keyof TemplateMergeData];
      return value !== undefined ? value : match;
    });
  };

  return {
    offerTitlePattern: replacePlaceholders(template.offerTitlePattern),
    introTextPattern: replacePlaceholders(template.introTextPattern),
    agreementText: replacePlaceholders(template.agreementText),
    closingText: replacePlaceholders(template.closingText),
    forLandlordText: replacePlaceholders(template.forLandlordText),
    footnotes: template.footnotes.map(replacePlaceholders),
    termsOfTenancy: template.termsOfTenancy.map((term) => ({
      ...term,
      title: replacePlaceholders(term.title),
      content: Array.isArray(term.content)
        ? term.content.map(replacePlaceholders)
        : replacePlaceholders(term.content),
      ...(term.intro ? { intro: replacePlaceholders(term.intro) } : {}),
    })),
  };
}

/**
 * Validates a template, returning whether it's valid and any error messages.
 */
export function validateTemplate(template: OfferLetterTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!template.offerTitlePattern?.trim()) {
    errors.push("Offer title pattern is required");
  }
  if (!template.introTextPattern?.trim()) {
    errors.push("Introduction text pattern is required");
  }
  if (!template.agreementText?.trim()) {
    errors.push("Agreement text is required");
  }
  if (!template.closingText?.trim()) {
    errors.push("Closing text is required");
  }
  if (!template.forLandlordText?.trim()) {
    errors.push("For landlord text is required");
  }

  template.termsOfTenancy.forEach((term, i) => {
    if (!term.title?.trim()) {
      errors.push(`Term ${i + 1}: title is required`);
    }
    if (Array.isArray(term.content)) {
      if (term.content.length === 0) {
        errors.push(`Term ${i + 1}: content is required`);
      } else {
        term.content.forEach((item, j) => {
          if (!item?.trim()) {
            errors.push(
              `Term ${i + 1}, sub-item ${j + 1}: content is required`,
            );
          }
        });
      }
    } else if (!term.content?.trim()) {
      errors.push(`Term ${i + 1}: content is required`);
    }
  });

  return { valid: errors.length === 0, errors };
}
