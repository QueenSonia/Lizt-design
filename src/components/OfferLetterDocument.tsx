import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import { Button } from "./ui/button";
import { loadBranding, BrandingData } from "../utils/brandingStorage";
import { formatNigerianAddress } from "../utils/addressFormatter";
import type { OfferLetterTemplate } from "../types/offer-letter-template";
import { DEFAULT_TEMPLATE } from "../types/offer-letter-template";
import {
  addTerm,
  removeTerm,
  addSubItem,
  removeSubItem,
  convertTermToSubItems,
} from "../utils/offer-letter-template-utils";

/**
 * Content snapshot for offer letter
 */
export interface ContentSnapshot {
  offer_title: string;
  intro_text: string;
  agreement_text: string;
  closing_text: string;
  for_landlord_text: string;
  tenant_address: string;
  permitted_use: string;
  rent_amount_formatted?: string;
  service_charge_formatted?: string;
  caution_deposit_formatted?: string;
  legal_fee_formatted?: string;
  agency_fee_formatted?: string;
  tenancy_term?: string;
  tenancy_period?: string;
}

export interface OfferLetterData {
  applicantName: string;
  applicantEmail: string;
  applicantGender?: string;
  propertyName: string;
  rentAmount: number;
  rentFrequency: string;
  serviceCharge?: number;
  tenancyStartDate: string;
  tenancyEndDate?: string;
  cautionDeposit?: number;
  legalFee?: number;
  agencyFee?: string | number;
  tenantAddress?: string;
  createdAt?: string;
  // Digital signature data (post-OTP acceptance)
  signedAt?: string; // ISO datetime string
  otp?: string; // OTP used to sign
  signedByPhone?: string; // Phone number used for signing
  status?: "pending" | "accepted" | "selected" | "rejected"; // Offer status
}

interface OfferLetterDocumentProps {
  data: OfferLetterData;
  mode?: "edit" | "view" | "template-edit";
  template?: OfferLetterTemplate;
  onTemplateChange?: (template: OfferLetterTemplate) => void;
  onTermsUpdate?: (
    terms: Array<{ title: string; content: string | string[] }>,
  ) => void;
  onContentUpdate?: (snapshot: ContentSnapshot) => void;
  branding?: BrandingData;
  showPlaceholders?: boolean;
  allowStructuralEdits?: boolean;
}

export const STANDARD_TERMS: Array<{
  title: string;
  content: string | string[];
  intro?: string;
}> = DEFAULT_TEMPLATE.termsOfTenancy.map((t) => ({ ...t }));

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export function EditableField({
  value,
  onChange,
  className = "",
  multiline = false,
  placeholder,
}: EditableFieldProps) {
  const contentRef = useRef<HTMLDivElement | HTMLSpanElement>(null);

  const handleBlur = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorPosition = range?.startOffset;

      const content = contentRef.current.innerHTML;
      const cleanedContent = content
        .replace(/<div>/g, "")
        .replace(/<\/div>/g, "<br>");

      if (cleanedContent !== content) {
        contentRef.current.innerHTML = cleanedContent;

        if (selection && range && cursorPosition !== undefined) {
          try {
            const newRange = document.createRange();
            const textNode = contentRef.current.firstChild;
            if (textNode) {
              newRange.setStart(
                textNode,
                Math.min(cursorPosition, textNode.textContent?.length || 0),
              );
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch {}
        }
      }
    }
  };

  const baseClassName = `${className} outline-none cursor-text transition-all hover:bg-orange-50/30 hover:ring-1 hover:ring-orange-200 rounded px-1 -mx-1 focus:bg-orange-50/50 focus:ring-2 focus:ring-orange-300`;

  if (multiline) {
    return (
      <div
        ref={contentRef as React.RefObject<HTMLDivElement>}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onInput={handleInput}
        className={baseClassName}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    );
  }

  return (
    <span
      ref={contentRef as React.RefObject<HTMLSpanElement>}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={baseClassName}
      dangerouslySetInnerHTML={{ __html: value }}
      data-placeholder={placeholder}
    />
  );
}

const getFontFamily = (fontName?: string) => {
  if (!fontName) return "var(--font-inter)";
  switch (fontName) {
    case "Inter":
      return "var(--font-inter)";
    case "IBM Plex Sans":
      return "var(--font-ibm-plex-sans)";
    case "DM Sans":
      return "var(--font-dm-sans)";
    default:
      return fontName;
  }
};

export function OfferLetterDocument({
  data,
  mode = "view",
  template,
  onTemplateChange,
  onTermsUpdate,
  onContentUpdate,
  branding: brandingProp,
  showPlaceholders = false,
  allowStructuralEdits = false,
}: OfferLetterDocumentProps) {
  const isTemplateEdit = mode === "template-edit";

  // Resolve the effective template: provided template > DEFAULT_TEMPLATE
  const effectiveTemplate = template || DEFAULT_TEMPLATE;

  const [brandingData, setBrandingData] = useState<BrandingData>(
    () => brandingProp || loadBranding(),
  );

  useEffect(() => {
    if (brandingProp) {
      setBrandingData(brandingProp);
    } else {
      setBrandingData(loadBranding());
    }
  }, [brandingProp]);

  const calculateTenancyTerm = useCallback(() => {
    if (!data.tenancyEndDate) return "One Year Fixed";

    const start = new Date(data.tenancyStartDate);
    const end = new Date(data.tenancyEndDate);
    const months = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );

    if (months >= 12) {
      const years = Math.floor(months / 12);
      return `${years} Year${years > 1 ? "s" : ""} Fixed`;
    }
    return `${months} Month${months > 1 ? "s" : ""} Fixed`;
  }, [data.tenancyStartDate, data.tenancyEndDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
            ? "rd"
            : "th";

    return ` ${month} ${day}${suffix}, ${year}`;
  };

  const calculateTenancyPeriod = useCallback(() => {
    return `${formatDate(data.tenancyStartDate)}${data.tenancyEndDate ? ` to ${formatDate(data.tenancyEndDate)}` : ""}`;
  }, [data.tenancyStartDate, data.tenancyEndDate]);

  const nameParts = data.applicantName.split(" ");
  const lastName = nameParts[nameParts.length - 1];

  const getSalutation = () => {
    if (data.applicantGender?.toLowerCase() === "female") {
      return "Ms";
    }
    return "Mr";
  };
  const salutation = getSalutation();

  // Resolve initial text values from template (replacing placeholders with actual data)
  const resolvePattern = (pattern: string) => {
    return pattern
      .replace(/\{propertyName\}/g, data.propertyName)
      .replace(/\{tenantName\}/g, data.applicantName)
      .replace(/\{tenantAddress\}/g, formatNigerianAddress(data.tenantAddress))
      .replace(/\{salutation\}/g, salutation)
      .replace(/\{lastName\}/g, lastName);
  };

  const [offerTitle, setOfferTitle] = useState(
    resolvePattern(effectiveTemplate.offerTitlePattern).toUpperCase(),
  );
  const [introText, setIntroText] = useState(
    resolvePattern(effectiveTemplate.introTextPattern),
  );
  const [permittedUse, setPermittedUse] = useState(
    "Residential, but office use is permitted provided it is carried on in a quiet and discreet manner.",
  );
  const [rentAmount, setRentAmount] = useState(
    `₦${Number(data.rentAmount).toLocaleString()}`,
  );
  const [serviceCharge, setServiceCharge] = useState(
    data.serviceCharge ? `₦${Number(data.serviceCharge).toLocaleString()}` : "",
  );
  const [cautionDeposit, setCautionDeposit] = useState(
    data.cautionDeposit
      ? `₦${Number(data.cautionDeposit).toLocaleString()}`
      : "",
  );
  const [legalFee, setLegalFee] = useState(
    data.legalFee ? `₦${Number(data.legalFee).toLocaleString()}` : "",
  );
  const [agencyFee, setAgencyFee] = useState(
    typeof data.agencyFee === "number"
      ? `₦${Number(data.agencyFee).toLocaleString()}`
      : data.agencyFee ||
          "As agreed between tenant and agent (paid directly to agent)",
  );
  const [tenancyTerm, setTenancyTerm] = useState(calculateTenancyTerm());
  const [tenancyPeriod, setTenancyPeriod] = useState(calculateTenancyPeriod());
  const [agreementText, setAgreementText] = useState(
    effectiveTemplate.agreementText,
  );
  const [closingText, setClosingText] = useState(effectiveTemplate.closingText);
  const [forLandlordText, setForLandlordText] = useState(
    effectiveTemplate.forLandlordText,
  );
  const [tenantAddress, setTenantAddress] = useState(
    formatNigerianAddress(data.tenantAddress),
  );
  const [terms, setTerms] = useState(
    effectiveTemplate.termsOfTenancy.map((t) => ({ ...t })),
  );
  const [issuedDate, setIssuedDate] = useState(
    formatDate(data.createdAt || new Date().toISOString()),
  );

  useEffect(() => {
    setOfferTitle(
      resolvePattern(effectiveTemplate.offerTitlePattern).toUpperCase(),
    );
    setIntroText(resolvePattern(effectiveTemplate.introTextPattern));
    setRentAmount(`₦${Number(data.rentAmount).toLocaleString()}`);
    setServiceCharge(
      data.serviceCharge
        ? `₦${Number(data.serviceCharge).toLocaleString()}`
        : "",
    );
    setCautionDeposit(
      data.cautionDeposit
        ? `₦${Number(data.cautionDeposit).toLocaleString()}`
        : "",
    );
    setLegalFee(
      data.legalFee ? `₦${Number(data.legalFee).toLocaleString()}` : "",
    );
    setAgencyFee(
      typeof data.agencyFee === "number"
        ? `₦${Number(data.agencyFee).toLocaleString()}`
        : data.agencyFee ||
            "As agreed between tenant and agent (paid directly to agent)",
    );
    setTenancyTerm(calculateTenancyTerm());
    setTenancyPeriod(calculateTenancyPeriod());
    setTenantAddress(formatNigerianAddress(data.tenantAddress));
    setIssuedDate(formatDate(data.createdAt || new Date().toISOString()));
    setAgreementText(effectiveTemplate.agreementText);
    setClosingText(effectiveTemplate.closingText);
    setForLandlordText(effectiveTemplate.forLandlordText);
    setTerms(effectiveTemplate.termsOfTenancy.map((t) => ({ ...t })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, calculateTenancyPeriod, calculateTenancyTerm, effectiveTemplate]);

  useEffect(() => {
    if (mode === "edit" && onContentUpdate) {
      notifyContentUpdate();
    }
    if (mode === "edit" && onTermsUpdate) {
      onTermsUpdate(terms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const notifyContentUpdate = (overrides: Record<string, string> = {}) => {
    if (!onContentUpdate) return;

    const snapshot = {
      offer_title: offerTitle,
      intro_text: introText,
      agreement_text: agreementText,
      closing_text: closingText,
      for_landlord_text: forLandlordText,
      tenant_address: tenantAddress,
      permitted_use: permittedUse,
      rent_amount_formatted: rentAmount,
      service_charge_formatted: serviceCharge,
      caution_deposit_formatted: cautionDeposit,
      legal_fee_formatted: legalFee,
      agency_fee_formatted: agencyFee,
      tenancy_term: tenancyTerm,
      tenancy_period: tenancyPeriod,
      ...overrides,
    };
    onContentUpdate(snapshot);
  };

  const updateTermContent = (index: number, newContent: string) => {
    const updatedTerms = [...terms];
    updatedTerms[index] = { ...updatedTerms[index], content: newContent };
    setTerms(updatedTerms);
    onTermsUpdate?.(updatedTerms);
  };

  const updateTermTitle = (index: number, newTitle: string) => {
    const updatedTerms = [...terms];
    updatedTerms[index] = { ...updatedTerms[index], title: newTitle };
    setTerms(updatedTerms);
    onTermsUpdate?.(updatedTerms);
  };

  // Template-edit mode helpers: propagate structural changes via onTemplateChange
  const handleTemplateFieldChange = (
    field: keyof OfferLetterTemplate,
    value: string,
  ) => {
    if (onTemplateChange && template) {
      onTemplateChange({ ...template, [field]: value });
    }
  };

  const handleTemplateTermTitleChange = (termIndex: number, title: string) => {
    if (onTemplateChange && template) {
      const newTerms = template.termsOfTenancy.map((t, i) =>
        i === termIndex ? { ...t, title } : t,
      );
      onTemplateChange({ ...template, termsOfTenancy: newTerms });
    }
  };

  const handleTemplateTermContentChange = (
    termIndex: number,
    content: string,
  ) => {
    if (onTemplateChange && template) {
      const newTerms = template.termsOfTenancy.map((t, i) =>
        i === termIndex ? { ...t, content } : t,
      );
      onTemplateChange({ ...template, termsOfTenancy: newTerms });
    }
  };

  const handleTemplateSubItemChange = (
    termIndex: number,
    subIndex: number,
    value: string,
  ) => {
    if (onTemplateChange && template) {
      const newTerms = template.termsOfTenancy.map((t, i) => {
        if (i !== termIndex || !Array.isArray(t.content)) return t;
        const content = [...t.content];
        content[subIndex] = value;
        return { ...t, content };
      });
      onTemplateChange({ ...template, termsOfTenancy: newTerms });
    }
  };

  const handleTemplateTermIntroChange = (termIndex: number, intro: string) => {
    if (onTemplateChange && template) {
      const newTerms = template.termsOfTenancy.map((t, i) =>
        i === termIndex ? { ...t, intro: intro || undefined } : t,
      );
      onTemplateChange({ ...template, termsOfTenancy: newTerms });
    }
  };

  const handleTemplateFootnoteChange = (index: number, value: string) => {
    if (onTemplateChange && template) {
      const footnotes = [...template.footnotes];
      footnotes[index] = value;
      onTemplateChange({ ...template, footnotes });
    }
  };

  return (
    <div
      className={`bg-white py-6 px-3 sm:py-8 sm:px-6 md:py-12 md:px-12 lg:px-16 w-full max-w-full md:max-w-[850px] mx-auto text-black ${
        isTemplateEdit
          ? "border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden"
          : ""
      }`}
      style={{ fontFamily: getFontFamily(brandingData.bodyFont) }}
    >
      {/* Logo - Top Right */}
      <div className="flex justify-end mb-6 sm:mb-8">
        {isValidImageSrc(brandingData.letterhead) ? (
          <Image
            src={brandingData.letterhead}
            alt="Company Logo"
            width={800}
            height={50}
            className={`${
              isTemplateEdit ? "h-12 sm:h-16" : "h-[50px]"
            } w-auto object-contain object-right`}
            unoptimized={true}
          />
        ) : showPlaceholders ? (
          <div className="h-[50px] w-[240px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              [Your Logo Here]
            </span>
          </div>
        ) : null}
      </div>

      {/* Date */}
      <p
        className={`${
          isTemplateEdit
            ? "text-xs sm:text-sm"
            : "text-[12.25px] leading-[17.5px]"
        } mb-6`}
      >
        {isTemplateEdit ? "[Issued Date]" : issuedDate}
      </p>

      {/* Recipient Address */}
      <div className="mb-6">
        <p
          className={`font-bold ${
            isTemplateEdit
              ? "text-xs sm:text-sm"
              : "text-[11px] leading-[15px] text-[#1a1b23]"
          }`}
        >
          {isTemplateEdit ? "[Tenant Name]" : data.applicantName}
        </p>
        <div
          className={`font-bold whitespace-pre-line ${
            isTemplateEdit
              ? "text-xs sm:text-sm"
              : "text-[11px] leading-[15px] text-[#1a1b23]"
          }`}
        >
          {isTemplateEdit ? "[Tenant Address]" : tenantAddress}
        </div>
      </div>

      {/* Salutation */}
      <p
        className={`${
          isTemplateEdit ? "text-xs sm:text-sm" : "text-[14px] leading-[21px]"
        } mb-6`}
      >
        {isTemplateEdit ? (
          "Dear Mr/Ms [Last Name],"
        ) : (
          <>
            Dear {salutation} {lastName},
          </>
        )}
      </p>

      {/* Main Heading */}
      <p
        className={`font-bold uppercase underline mb-6 ${
          isTemplateEdit
            ? "text-xs sm:text-sm break-words"
            : "text-[12.25px] leading-[17.5px]"
        }`}
        style={{ fontFamily: getFontFamily(brandingData.headingFont) }}
      >
        {isTemplateEdit ? (
          <EditableField
            value={effectiveTemplate.offerTitlePattern}
            onChange={(val) =>
              handleTemplateFieldChange("offerTitlePattern", val)
            }
          />
        ) : mode === "edit" ? (
          <EditableField
            value={offerTitle}
            onChange={(val) => {
              setOfferTitle(val);
              notifyContentUpdate({ offer_title: val });
            }}
          />
        ) : (
          offerTitle
        )}
      </p>

      {/* Introduction */}
      <div
        className={`text-justify mb-6 ${
          isTemplateEdit
            ? "text-xs sm:text-sm leading-relaxed"
            : "text-[12.25px] leading-[17.5px]"
        }`}
      >
        {isTemplateEdit ? (
          <EditableField
            value={effectiveTemplate.introTextPattern}
            onChange={(val) =>
              handleTemplateFieldChange("introTextPattern", val)
            }
            multiline
          />
        ) : mode === "edit" ? (
          <EditableField
            value={introText}
            onChange={(val) => {
              setIntroText(val);
              notifyContentUpdate({ intro_text: val });
            }}
            multiline
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: introText }} />
        )}
      </div>

      {/* Commercial Terms - EXACT MATCH TO DESIGN REFERENCE (bullet points) */}
      {isTemplateEdit ? (
        <div className="mb-6 space-y-3 text-xs sm:text-sm text-[#1a1b23]">
          {/* Permitted Use */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Permitted Use: </span>
              <EditableField
                value={permittedUse}
                onChange={(val) => {
                  setPermittedUse(val);
                  notifyContentUpdate({ permitted_use: val });
                }}
              />
            </div>
          </div>

          {/* Rent */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Rent: </span>
              <span className="text-blue-600">[Amount from property]</span>
            </div>
          </div>

          {/* Service Charge */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Service Charge: </span>
              <span className="text-blue-600">[Amount from property]</span>
            </div>
          </div>

          {/* Caution Deposit */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Caution Deposit: </span>
              <span className="text-blue-600">[Amount from property]</span>
            </div>
          </div>

          {/* Legal Fee */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Legal Fee: </span>
              <span className="text-blue-600">[Amount from property]</span>
            </div>
          </div>

          {/* Agency Fee */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Agency Fee: </span>
              <span className="text-blue-600">
                [Amount or text from property]
              </span>
            </div>
          </div>

          {/* Tenancy Term */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Tenancy Term: </span>
              <span className="text-blue-600">[Calculated from dates]</span>
            </div>
          </div>

          {/* Tenancy Period */}
          <div className="flex gap-2">
            <span className="shrink-0 mt-px">•</span>
            <div className="flex-1">
              <span className="font-bold">Tenancy Period: </span>
              <span className="text-blue-600">[Date range from property]</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 space-y-1.5">
          {/* ORIGINAL FLEX LAYOUT FOR EDIT/VIEW MODES - UNCHANGED */}
          <div className="flex">
            <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
              Permitted Use:
            </span>
            <span className="text-[11px] leading-[15px] text-[#1a1b23]">
              {mode === "edit" ? (
                <EditableField
                  value={permittedUse}
                  onChange={(val) => {
                    setPermittedUse(val);
                    notifyContentUpdate({ permitted_use: val });
                  }}
                />
              ) : (
                permittedUse
              )}
            </span>
          </div>

          <div className="flex">
            <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
              Rent:
            </span>
            <span className="text-[11px] leading-[15px] text-[#1a1b23]">
              {mode === "edit" ? (
                <EditableField
                  value={rentAmount}
                  onChange={(val) => {
                    setRentAmount(val);
                    notifyContentUpdate({ rent_amount_formatted: val });
                  }}
                />
              ) : (
                rentAmount
              )}
            </span>
          </div>

          {data.serviceCharge && (
            <div className="flex">
              <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold w-[140px] shrink-0 underline">
                Service Charge:
              </span>
              <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                {mode === "edit" ? (
                  <EditableField
                    value={serviceCharge}
                    onChange={(val) => {
                      setServiceCharge(val);
                      notifyContentUpdate({ service_charge_formatted: val });
                    }}
                  />
                ) : (
                  serviceCharge
                )}
              </span>
            </div>
          )}

          {data.cautionDeposit && (
            <div className="flex">
              <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
                Caution<sup>1</sup>:
              </span>
              <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                {mode === "edit" ? (
                  <EditableField
                    value={cautionDeposit}
                    onChange={(val) => {
                      setCautionDeposit(val);
                      notifyContentUpdate({ caution_deposit_formatted: val });
                    }}
                  />
                ) : (
                  cautionDeposit
                )}
              </span>
            </div>
          )}

          {data.legalFee && (
            <div className="flex">
              <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
                Legal Fee:
              </span>
              <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                {mode === "edit" ? (
                  <EditableField
                    value={legalFee}
                    onChange={(val) => {
                      setLegalFee(val);
                      notifyContentUpdate({ legal_fee_formatted: val });
                    }}
                  />
                ) : (
                  legalFee
                )}
              </span>
            </div>
          )}

          {(mode === "edit" || data.agencyFee) && (
            <div className="flex">
              <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
                Agency Fee:
              </span>
              <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                {mode === "edit" ? (
                  <EditableField
                    value={agencyFee}
                    onChange={(val) => {
                      setAgencyFee(val);
                      notifyContentUpdate({ agency_fee_formatted: val });
                    }}
                  />
                ) : (
                  agencyFee
                )}
              </span>
            </div>
          )}

          <div className="flex">
            <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
              Tenancy Term:
            </span>
            <span className="text-[11px] leading-[15px] text-[#1a1b23]">
              {mode === "edit" ? (
                <EditableField
                  value={tenancyTerm}
                  onChange={(val) => {
                    setTenancyTerm(val);
                    notifyContentUpdate({ tenancy_term: val });
                  }}
                />
              ) : (
                tenancyTerm
              )}
            </span>
          </div>

          <div className="flex">
            <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">
              Tenancy Period:
            </span>
            <span className="text-[11px] leading-[15px] text-[#1a1b23]">
              {mode === "edit" ? (
                <EditableField
                  value={tenancyPeriod}
                  onChange={(val) => {
                    setTenancyPeriod(val);
                    notifyContentUpdate({ tenancy_period: val });
                  }}
                />
              ) : (
                tenancyPeriod
              )}
            </span>
          </div>
        </div>
      )}

      {/* Non-binding Agreement Text */}
      <div
        className={`text-justify mb-6 ${
          isTemplateEdit
            ? "text-xs sm:text-sm leading-relaxed"
            : "text-[11px] leading-[15px] text-[#1a1b23]"
        }`}
      >
        {isTemplateEdit ? (
          <EditableField
            value={effectiveTemplate.agreementText}
            onChange={(val) => handleTemplateFieldChange("agreementText", val)}
            multiline
          />
        ) : mode === "edit" ? (
          <EditableField
            value={agreementText}
            onChange={(val) => {
              setAgreementText(val);
              notifyContentUpdate({ agreement_text: val });
            }}
            multiline
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: agreementText }} />
        )}
      </div>

      {/* Closing */}
      <p
        className={`mb-4 ${
          isTemplateEdit
            ? "text-xs sm:text-sm"
            : "text-[12.25px] leading-[17.5px]"
        }`}
      >
        {isTemplateEdit ? (
          <EditableField
            value={effectiveTemplate.closingText}
            onChange={(val) => handleTemplateFieldChange("closingText", val)}
          />
        ) : mode === "edit" ? (
          <EditableField
            value={closingText}
            onChange={(val) => {
              setClosingText(val);
              notifyContentUpdate({ closing_text: val });
            }}
          />
        ) : (
          closingText
        )}
      </p>

      {/* Signature */}
      {isValidImageSrc(brandingData.signature) ? (
        <Image
          src={brandingData.signature}
          alt="Signature"
          width={600}
          height={38}
          className={`${
            isTemplateEdit ? "h-10 sm:h-12" : "h-[38px]"
          } w-auto object-contain mb-2`}
          unoptimized={true}
        />
      ) : showPlaceholders ? (
        <div
          className={`${
            isTemplateEdit ? "h-10 sm:h-12" : "h-[38px]"
          } w-[300px] flex items-center border-2 border-dashed border-gray-300 rounded bg-gray-50 mb-2`}
        >
          <span className="text-xs text-gray-400 pl-4">[Your Signature]</span>
        </div>
      ) : null}

      {/* For Landlord */}
      <p
        className={`italic mb-8 ${
          isTemplateEdit ? "text-xs" : "text-[12.25px] leading-[17.5px]"
        }`}
      >
        {isTemplateEdit ? (
          <EditableField
            value={effectiveTemplate.forLandlordText}
            onChange={(val) =>
              handleTemplateFieldChange("forLandlordText", val)
            }
          />
        ) : mode === "edit" ? (
          <EditableField
            value={forLandlordText}
            onChange={(val) => {
              setForLandlordText(val);
              notifyContentUpdate({ for_landlord_text: val });
            }}
          />
        ) : (
          forLandlordText
        )}
      </p>

      {/* Footnotes */}
      <div
        className={`text-[9px] leading-[13px] text-[#1a1b23] mb-8 space-y-1 ${
          isTemplateEdit ? "border-t pt-4" : ""
        }`}
      >
        {isTemplateEdit
          ? effectiveTemplate.footnotes.map((footnote, i) => (
              <p key={i} className="italic">
                <sup>{i + 1}</sup>{" "}
                <EditableField
                  value={footnote}
                  onChange={(val) => handleTemplateFootnoteChange(i, val)}
                />
              </p>
            ))
          : effectiveTemplate.footnotes.map((footnote, i) => (
              <p key={i} className="italic">
                <sup>{i + 1}</sup> {footnote}
              </p>
            ))}
      </div>

      {/* Terms of Tenancy Section */}
      <div className="space-y-6">
        <div className="my-8 sm:my-12 border-t-2 border-gray-400" />

        <h2
          className={`font-bold uppercase mb-6 text-center ${
            isTemplateEdit
              ? "text-sm sm:text-base"
              : "text-[12px] leading-[16px] text-[#1a1b23]"
          }`}
          style={{ fontFamily: getFontFamily(brandingData.headingFont) }}
        >
          TERMS OF TENANCY
        </h2>

        <p
          className={`mb-6 ${isTemplateEdit ? "text-sm leading-relaxed" : "text-[11px] leading-[15px] text-[#1a1b23]"}`}
        >
          The following terms shall govern the tenancy relationship between{" "}
          <span className="underline">
            {brandingData.businessName || "[Landlord Name]"}
          </span>{" "}
          (&quot;the Landlord&quot;) and you,{" "}
          <span className="underline">
            {isTemplateEdit ? "[Tenant Name]" : data.applicantName}
          </span>{" "}
          <span className="font-bold">&quot;the Tenant&quot;</span>.
        </p>

        {isTemplateEdit
          ? /* Template-edit mode: render from template with structural edit support */
            effectiveTemplate.termsOfTenancy.map((term, termIndex) => (
              <div key={termIndex} className="group relative">
                {/* Term header with optional remove button */}
                <div className="flex items-start gap-2 mb-3">
                  <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold flex-1">
                    <span className="mr-1">{termIndex + 1}.</span>
                    <EditableField
                      value={term.title}
                      onChange={(val) =>
                        handleTemplateTermTitleChange(termIndex, val)
                      }
                    />
                  </h3>
                  {allowStructuralEdits && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        template &&
                        onTemplateChange?.(removeTerm(template, termIndex))
                      }
                      disabled={effectiveTemplate.termsOfTenancy.length <= 1}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-red-500 hover:bg-red-50 text-xs"
                      title="Remove term"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {/* Term content */}
                <div className="text-[11px] leading-[15px] text-justify">
                  {term.intro !== undefined && (
                    <div className="mb-3">
                      <EditableField
                        value={term.intro || ""}
                        onChange={(val) =>
                          handleTemplateTermIntroChange(termIndex, val)
                        }
                      />
                    </div>
                  )}

                  {Array.isArray(term.content) ? (
                    <div className="space-y-2">
                      <ul className="list-disc ml-8 space-y-2">
                        {term.content.map((item, subIndex) => (
                          <li key={subIndex} className="group/sub relative">
                            <div className="flex items-start gap-1">
                              <EditableField
                                value={item}
                                onChange={(val) =>
                                  handleTemplateSubItemChange(
                                    termIndex,
                                    subIndex,
                                    val,
                                  )
                                }
                                className="flex-1"
                              />
                              {allowStructuralEdits && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    template &&
                                    onTemplateChange?.(
                                      removeSubItem(
                                        template,
                                        termIndex,
                                        subIndex,
                                      ),
                                    )
                                  }
                                  className="opacity-0 group-hover/sub:opacity-100 transition-opacity h-5 w-5 p-0 text-red-500 hover:bg-red-50 shrink-0"
                                  title="Remove sub-item"
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {allowStructuralEdits && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            template &&
                            onTemplateChange?.(addSubItem(template, termIndex))
                          }
                          className="text-[#FF5000] hover:text-[#E64800] hover:bg-orange-50 h-6 text-[10px] ml-8"
                        >
                          + Add sub-item
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <EditableField
                        value={term.content}
                        onChange={(val) =>
                          handleTemplateTermContentChange(termIndex, val)
                        }
                        multiline
                      />
                      {allowStructuralEdits && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            template &&
                            onTemplateChange?.(
                              convertTermToSubItems(template, termIndex),
                            )
                          }
                          className="text-[#FF5000] hover:text-[#E64800] hover:bg-orange-50 h-6 text-[10px]"
                        >
                          + Convert to bullet list
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          : /* edit / view mode: render from local state (terms) */
            terms.map((term, index) => (
              <div key={`term-${index}-${term.title}`}>
                <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">
                  {mode === "edit" ? (
                    <EditableField
                      value={`${index + 1}. ${term.title}`}
                      onChange={(val) => {
                        const newTitle = val.replace(/^\d+\.\s*/, "");
                        updateTermTitle(index, newTitle);
                      }}
                    />
                  ) : (
                    `${index + 1}. ${term.title}`
                  )}
                </h3>
                <div className="text-[11px] leading-[15px] text-justify">
                  {mode === "edit" ? (
                    <EditableField
                      value={
                        Array.isArray(term.content)
                          ? term.content.join("<br>")
                          : term.content
                      }
                      onChange={(val) => updateTermContent(index, val)}
                      multiline
                    />
                  ) : (
                    <>
                      {term.intro && (
                        <p className="text-[11px] leading-[15px] text-[#1a1b23] mb-3">
                          {term.intro}
                        </p>
                      )}
                      {(() => {
                        // Normalize content: if it's a string with newlines, split into array for bullet rendering
                        const contentItems = Array.isArray(term.content)
                          ? term.content
                          : typeof term.content === "string" &&
                              term.content.includes("\n")
                            ? term.content
                                .split("\n")
                                .filter((line: string) => line.trim())
                            : null;

                        if (contentItems) {
                          return (
                            <ul className="list-disc ml-8 space-y-2">
                              {contentItems.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-[11px] leading-[15px] text-[#1a1b23]"
                                  dangerouslySetInnerHTML={{ __html: item }}
                                />
                              ))}
                            </ul>
                          );
                        }

                        return (
                          <div
                            className="text-[11px] leading-[15px] text-[#1a1b23] text-justify"
                            dangerouslySetInnerHTML={{
                              __html: term.content as string,
                            }}
                          />
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            ))}

        {/* Add Term button - only in template-edit mode with structural edits */}
        {isTemplateEdit && allowStructuralEdits && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => template && onTemplateChange?.(addTerm(template))}
            className="text-[#FF5000] border-[#FF5000] hover:bg-orange-50 hover:border-[#FF5000]"
          >
            + Add New Term
          </Button>
        )}
      </div>

      {/* Gradient separator line */}
      <div className="h-px bg-linear-to-r from-transparent via-gray-300 to-transparent my-8" />

      {/* Digital Signature Section - Show when offer is Accepted or Rejected */}
      {(() => {
        console.log("OfferLetterDocument - data.status:", data.status);
        console.log("OfferLetterDocument - full data:", data);

        const isAccepted =
          data.status === "accepted" || data.status === "selected";
        const isRejected = data.status === "rejected";

        return data.status && (isAccepted || isRejected) ? (
          <div className="mt-12 mb-12 relative">
            <h2 className="text-sm font-bold mb-4">Digital Signature :</h2>

            {/* Distressed Rubber Stamp */}
            <div
              className="absolute inset-0 flex items-center justify-start pointer-events-none z-10"
              style={{
                transform: "rotate(-22deg) translateY(-40px)",
                paddingLeft: "2rem",
              }}
            >
              {/* SVG filter for grunge/distressed effect */}
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                  <filter id={`distressed-stamp-${data.status}`}>
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.8"
                      numOctaves="4"
                      result="noise"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="3"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                    <feGaussianBlur stdDeviation="0.3" />
                  </filter>
                </defs>
              </svg>

              {/* Main stamp container */}
              <div
                className="relative px-5 py-2.5"
                style={{
                  border: isAccepted
                    ? "6px solid rgba(30, 30, 30, 0.4)"
                    : "6px solid rgba(211, 47, 47, 0.4)",
                  backgroundColor: "transparent",
                  filter: `url(#distressed-stamp-${data.status})`,
                }}
              >
                {/* Inner border for depth */}
                <div
                  style={{
                    position: "absolute",
                    inset: "3px",
                    border: isAccepted
                      ? "1.5px solid rgba(30, 30, 30, 0.3)"
                      : "1.5px solid rgba(211, 47, 47, 0.3)",
                    pointerEvents: "none",
                  }}
                />

                {/* Stamp text */}
                <div
                  className="text-4xl font-black tracking-wider relative"
                  style={{
                    color: isAccepted
                      ? "rgba(30, 30, 30, 0.45)"
                      : "rgba(211, 47, 47, 0.45)",
                    letterSpacing: "0.25em",
                    fontFamily:
                      'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                    fontWeight: 900,
                    textShadow: isAccepted
                      ? `2px 2px 0px rgba(30, 30, 30, 0.2), -1px -1px 0px rgba(30, 30, 30, 0.15), 1px 0px 2px rgba(30, 30, 30, 0.1)`
                      : `2px 2px 0px rgba(211, 47, 47, 0.2), -1px -1px 0px rgba(211, 47, 47, 0.15), 1px 0px 2px rgba(211, 47, 47, 0.1)`,
                    WebkitTextStroke: isAccepted
                      ? "0.8px rgba(30, 30, 30, 0.25)"
                      : "0.8px rgba(211, 47, 47, 0.25)",
                  }}
                >
                  {isAccepted ? "ACCEPTED" : "REJECTED"}
                </div>

                {/* Grunge overlay spots */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isAccepted
                      ? `radial-gradient(circle at 20% 30%, transparent 0%, transparent 40%, rgba(30, 30, 30, 0.06) 50%, transparent 60%), radial-gradient(circle at 80% 70%, transparent 0%, transparent 35%, rgba(30, 30, 30, 0.07) 45%, transparent 55%), radial-gradient(circle at 50% 90%, transparent 0%, transparent 30%, rgba(30, 30, 30, 0.05) 40%, transparent 50%), radial-gradient(circle at 10% 80%, transparent 0%, transparent 25%, rgba(30, 30, 30, 0.06) 35%, transparent 45%)`
                      : `radial-gradient(circle at 20% 30%, transparent 0%, transparent 40%, rgba(211, 47, 47, 0.06) 50%, transparent 60%), radial-gradient(circle at 80% 70%, transparent 0%, transparent 35%, rgba(211, 47, 47, 0.07) 45%, transparent 55%), radial-gradient(circle at 50% 90%, transparent 0%, transparent 30%, rgba(211, 47, 47, 0.05) 40%, transparent 50%), radial-gradient(circle at 10% 80%, transparent 0%, transparent 25%, rgba(211, 47, 47, 0.06) 35%, transparent 45%)`,
                    pointerEvents: "none",
                    mixBlendMode: "multiply",
                  }}
                />

                {/* Edge wear effect */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: isAccepted
                      ? "linear-gradient(90deg, transparent 0%, rgba(30, 30, 30, 0.15) 10%, transparent 25%, rgba(30, 30, 30, 0.1) 40%, transparent 60%, rgba(30, 30, 30, 0.12) 80%, transparent 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(211, 47, 47, 0.15) 10%, transparent 25%, rgba(211, 47, 47, 0.1) 40%, transparent 60%, rgba(211, 47, 47, 0.12) 80%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: isAccepted
                      ? "linear-gradient(90deg, transparent 0%, rgba(30, 30, 30, 0.1) 15%, transparent 35%, rgba(30, 30, 30, 0.15) 55%, transparent 70%, rgba(30, 30, 30, 0.12) 90%, transparent 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(211, 47, 47, 0.1) 15%, transparent 35%, rgba(211, 47, 47, 0.15) 55%, transparent 70%, rgba(211, 47, 47, 0.12) 90%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* Signature details table */}
            <div className="space-y-2 relative z-0">
              <div className="flex flex-col sm:flex-row text-sm">
                <span className="sm:w-48 shrink-0 font-medium sm:font-normal">
                  Sign Name
                </span>
                <span className="flex-1 sm:mt-0 mt-1">
                  {data.applicantName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row text-sm">
                <span className="sm:w-48 shrink-0 font-medium sm:font-normal">
                  OTP
                </span>
                <span className="flex-1 sm:mt-0 mt-1">
                  {data.otp || "Recorded"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row text-sm">
                <span className="sm:w-48 shrink-0 font-medium sm:font-normal">
                  Date and Time Signed
                </span>
                <span className="flex-1 sm:mt-0 mt-1">
                  {data.signedAt
                    ? (() => {
                        const signedDate = new Date(data.signedAt);
                        const day = String(signedDate.getDate()).padStart(
                          2,
                          "0",
                        );
                        const month = String(
                          signedDate.getMonth() + 1,
                        ).padStart(2, "0");
                        const year = signedDate.getFullYear();
                        const hours = String(signedDate.getHours()).padStart(
                          2,
                          "0",
                        );
                        const minutes = String(
                          signedDate.getMinutes(),
                        ).padStart(2, "0");
                        const seconds = String(
                          signedDate.getSeconds(),
                        ).padStart(2, "0");
                        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
                      })()
                    : "Recorded"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row text-sm">
                <span className="sm:w-48 shrink-0 font-medium sm:font-normal">
                  Phone
                </span>
                <span className="flex-1 sm:mt-0 mt-1">
                  {data.signedByPhone || "Recorded"}
                </span>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Footer - Centered */}
      <div
        className="text-center text-sm pt-4 mt-12"
        style={{ color: brandingData.footerColor || "#6B6B6B" }}
      >
        {brandingData.businessAddress && (
          <p className="font-bold">{brandingData.businessAddress}</p>
        )}
        {(brandingData.contactEmail || brandingData.contactPhone) && (
          <p className="font-bold">
            {brandingData.contactEmail && (
              <span>{brandingData.contactEmail}</span>
            )}
            {brandingData.contactEmail && brandingData.contactPhone && " || "}
            {brandingData.contactPhone && (
              <span>{brandingData.contactPhone}</span>
            )}
          </p>
        )}
        {brandingData.websiteLink && (
          <p className="text-blue-600 underline">{brandingData.websiteLink}</p>
        )}
      </div>
    </div>
  );
}
