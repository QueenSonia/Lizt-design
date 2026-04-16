/**
 * A single term of tenancy within an offer letter template.
 */
export interface TemplateTermOfTenancy {
  title: string;
  content: string | string[];
  intro?: string;
}

/**
 * The complete offer letter template structure, stored per-landlord as JSONB.
 * Contains all customizable static text, labels, and terms of tenancy.
 */
export interface OfferLetterTemplate {
  offerTitlePattern: string;
  introTextPattern: string;
  agreementText: string;
  closingText: string;
  forLandlordText: string;
  footnotes: string[];
  termsOfTenancy: TemplateTermOfTenancy[];
}

/**
 * The default offer letter template matching the current STANDARD_TERMS
 * and hardcoded text from OfferLetterDocument.tsx.
 * Used when a landlord has no saved template.
 */
export const DEFAULT_TEMPLATE: OfferLetterTemplate = {
  offerTitlePattern: "OFFER FOR RENT OF {propertyName}",
  introTextPattern:
    'Following your visit and review of the property "{propertyName}" (hereafter the "Property"), we hereby make you an offer to rent the Property upon the following terms:',
  agreementText:
    'This <span class="underline">Offer</span> and the attached <span class="underline">Terms of Tenancy</span> (together the "<span class="font-bold">Agreement</span>") is non-binding until you have signed the Agreement, made payment into the landlord\'s account, and have been handed the keys to the Property.',
  closingText: "Yours faithfully,",
  forLandlordText: "For Landlord",
  footnotes: [
    "The means the equivalent cost of repainting ground-ceiling and services which include but are not limited to: the water treatment plant and supply system, motor, mouldy additions, security, cleaning of general areas, and waste management.",
    "Refundable at the expiry of the tenancy upon good maintenance of the property by the tenant.",
  ],
  termsOfTenancy: [
    {
      title: "Permitted Use",
      content:
        "The Property shall be used solely for residential or office purposes (and in a quiet and discreet manner). Commercial use, Airbnb/short-let, or subletting is strictly prohibited.",
    },
    {
      title: "Condition of Property",
      content: [
        'The Property is being let "as is" in its condition as at the date of inspection and acceptance by the Tenant.',
        "No further works, renovations, replacements, or modifications are required from the Landlord as a condition of taking possession, unless expressly stated in writing.",
      ],
    },
    {
      title: "Conduct & Restrictions",
      content: [
        "No noisy generators are allowed, but you may install an Inverter.",
        "Pets must remain inside your apartment; pets in common areas are prohibited.",
        "No illegal or nuisance activity is permitted within the Property or the premises.",
      ],
    },
    {
      title: "Caution Deposit",
      content: [
        "Refundable only after vacating and returning possession of the Property.",
        "Deductions may be made for damages beyond fair wear and tear or outstanding obligations.",
      ],
    },
    {
      title: "Repairs & Maintenance",
      content: [
        "Tenant shall be responsible for internal repairs & minor maintenance.",
        "Landlord shall be responsible for structural repairs and major building systems.",
        "Damage caused by Tenant negligence is Tenant's responsibility.",
      ],
    },
    {
      title: "Access",
      content:
        "The Landlord may access the Property with reasonable notice for inspections, repairs, or emergencies.",
    },
    {
      title: "Service of Notices",
      intro:
        "Notices to the Tenant will be considered duly served if delivered by any of the following:",
      content: [
        "Left on the door of the Property;",
        "Sent via WhatsApp;",
        "Sent via email.",
      ],
    },
    {
      title: "Breach & Termination",
      content:
        "Non-compliance with these terms may result in disconnection from general utilities and services, termination, and/or eviction.",
    },
    {
      title: "Rent Refund",
      content: [
        "If the tenancy is terminated before the expiry date, whether by the Tenant or by the Landlord (in the case of breach), the Tenant shall only be entitled to a refund of the rent for the unused days remaining on the tenancy at the time the property is vacated.",
        "The refund will be processed only after the Tenant has fully vacated the Property and returned possession to the Landlord.",
      ],
    },
  ],
};
