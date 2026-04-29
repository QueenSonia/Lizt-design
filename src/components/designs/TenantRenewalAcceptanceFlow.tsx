/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { OTPInput, OTPInputContext } from "input-otp";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, CheckCircle2, XCircle, ArrowLeft, X, Download } from "lucide-react";
import jsPDF from "jspdf";

const imgImageLogo = "/designs/tenant-renewal-acceptance-flow/logo.png";
const imgImageSignature = "/designs/tenant-renewal-acceptance-flow/signature.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center border-b-2 border-gray-300 text-lg bg-transparent transition-all outline-none data-[active=true]:border-[#FF5722]",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-gray-900 h-6 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

type FlowStep = "offer" | "decline-confirm" | "declined" | "otp" | "accepted" | "payment" | "success";

interface AcceptanceDetails {
  dateAccepted: string;
  timeAccepted: string;
  dateTimeSigned: string;
  tenantName: string;
  signatureToken: string;
  tenantPhone?: string;
  tenantEmail?: string;
}

interface OfferData {
  offerId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  rentAmount: number;
  serviceCharge: number;
  cautionDeposit: number;
  legalFee: number;
  offerDate: string;
  moveInDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseDuration: string;
  paymentTerms: string;
}

const MOCK_OFFERS: Record<string, OfferData> = {
  abc123: {
    offerId: "abc123",
    tenantName: "Emmanuel Etim",
    tenantEmail: "emmybass9@yahoo.com",
    tenantPhone: "09069333649",
    propertyName: "Two Bedroom First Floor Apartment at 17 Ayinde Akinmade Street",
    propertyAddress: "17 Ayinde Akinmade Street, Lekki Phase 1, Lagos State",
    landlordName: "Panda Homes Nigeria Limited",
    landlordEmail: "contact@pandahomes.com",
    landlordPhone: "+234 803 456 7890",
    rentAmount: 6000000,
    serviceCharge: 750000,
    cautionDeposit: 0,
    legalFee: 0,
    offerDate: "April 24, 2026",
    moveInDate: "May 11, 2026",
    leaseStartDate: "May 11, 2026",
    leaseEndDate: "May 10, 2027",
    leaseDuration: "One Year Fixed",
    paymentTerms: "Full payment upfront",
  },
};

async function fetchOfferData(offerId: string): Promise<OfferData> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const offer = MOCK_OFFERS[offerId];
  if (!offer) {
    throw new Error("Offer not found");
  }
  return offer;
}

function OfferLetterDocument({ acceptance }: { acceptance?: AcceptanceDetails }) {
  return (
    <div className="bg-white px-8 sm:px-12 py-12 relative" data-name="OfferLetterDocument">
      <div className="flex justify-end mb-8">
        <img alt="" className="h-[50px] w-auto" src={imgImageLogo} />
      </div>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] mb-6">April 24, 2026</p>

      <div className="mb-6">
        <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">Emmanuel Etim</p>
        <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">Plot 23, Providence Street</p>
        <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">Lekki Phase 1</p>
        <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">Lagos State</p>
      </div>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] mb-6">Dear Mr Etim,</p>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold uppercase mb-6 underline">
        RENT RENEWAL OFFER FOR RENT OF TWO BEDROOM FIRST FLOOR APARTMENT AT 17 AYINDE AKINMADE STREET, LEKKI PHASE 1 LAGOS
      </p>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify mb-6">
        This is to formally notify you that your tenancy over the two-bedroom apartment situate at 17 Ayinde Akinmade Street, Lekki Phase 1 which you currently occupy expires on the 10th of May 2026. Following the expiry of your tenancy, we hereby make you an offer to rent the apartment for another tenancy period upon the following terms:
      </p>

      <div className="mb-6 space-y-[6px]">
        <div className="flex">
          <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">Permitted Use:</span>
          <span className="text-[11px] leading-[15px] text-[#1a1b23] italic">Residential.</span>
        </div>
        <div className="flex">
          <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">Rent:</span>
          <span className="text-[11px] leading-[15px] text-[#1a1b23]">₦6,000,000</span>
        </div>
        <div className="flex">
          <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold w-[140px] shrink-0 underline">Service Charge:<sup>1</sup></span>
          <span className="text-[11px] leading-[15px] text-[#1a1b23]">₦750,000</span>
        </div>
        <div className="flex">
          <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">Tenancy Term:</span>
          <span className="text-[11px] leading-[15px] text-[#1a1b23] italic">One Year Fixed.</span>
        </div>
        <div className="flex">
          <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold underline w-[140px] shrink-0">Tenancy Period:</span>
          <span className="text-[11px] leading-[15px] text-[#1a1b23] italic">May 11, 2026, to May 10, 2027</span>
        </div>
      </div>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify mb-6">
        This <span className="underline">Rent Renewal Offer</span> and the attached <span className="underline">Terms of Tenancy</span> (together the &quot;<span className="font-bold">Tenancy Agreement</span>&quot;) shall govern the tenancy relationship between <span className="underline">Panda Homes Nigeria Limited</span> (&quot;<span className="font-bold">the Landlord</span>&quot;) and you, <span className="underline">Emmanuel Etim</span> <span className="font-bold">(&quot;the Tenant&quot;)</span> for the <span className="underline">Tenancy Period</span>.
      </p>

      <p className="text-[11px] leading-[15px] text-[#1a1b23] mb-4">Yours faithfully,</p>

      <img alt="" className="h-[38px] w-auto mb-2" src={imgImageSignature} />

      <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-2">Olatunji Oginni</p>
      <p className="text-[11px] leading-[15px] text-[#1a1b23] italic mb-8">for Landlord</p>

      <div className="text-[9px] leading-[13px] text-[#1a1b23] mb-8 space-y-1">
        <p className="italic">
          <sup>1</sup> This covers the associated cost of maintaining general utilities and services which include but are not limited to, the water treatment plant and supply system, meter vending platform, security, cleaning of general areas, and waste management.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-[12px] leading-[16px] text-[#1a1b23] font-bold uppercase mb-6 underline">
          TERMS OF TENANCY
        </h2>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">1. Permitted Use</h3>
          <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
            The Property shall be used solely for residential purposes. Commercial use, Airbnb/short-let, or subletting is strictly prohibited.
          </p>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">2. Conduct &amp; Restrictions</h3>
          <ul className="list-disc ml-5 space-y-2">
            <li className="text-[11px] leading-[15px] text-[#1a1b23]">
              Pets must remain inside your apartment; pets in common areas are prohibited.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23]">
              You are not to cause to be done or permit any act or operation within the premises that is illegal or maybe considered a nuisance.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">3. Repairs &amp; Maintenance</h3>
          <ul className="list-disc ml-5 space-y-2">
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Tenant shall be responsible for internal repairs &amp; minor maintenance.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Landlord shall be responsible for structural repairs and major building systems.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Damage caused by Tenant negligence is Tenant&apos;s responsibility.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">4. Access</h3>
          <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
            The Landlord may access the Property with reasonable notice for inspections, repairs, or emergencies.
          </p>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">5. Service of Notices</h3>
          <ul className="list-disc ml-5 space-y-2">
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Notices to the Tenant will be considered duly served if delivered by any of the following methods: (1) affixed to the door of the Property; (2) sent via WhatsApp to <span className="font-bold">09069333649</span>; (3) sent via email to <span className="font-bold">emmybass9@yahoo.com</span>.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              The Tenant shall ensure that the WhatsApp number and email address provided in this Agreement remain valid and reachable. If the Tenant changes, loses access to, or is no longer reachable through either contact detail, the Tenant shall promptly notify the Landlord or the Landlord&apos;s representative in writing and provide updated contact details.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Until such notice of change is received, any notice sent to the last provided WhatsApp number or email address shall be deemed validly served.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">6. Breach &amp; Termination</h3>
          <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
            Non-compliance with these terms may result in disconnection from general utilities and services, termination, and/or eviction.
          </p>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">7. Refunds</h3>
          <ul className="list-disc ml-5 space-y-2">
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              If the tenancy is terminated before the expiry date, whether by the Tenant or by the Landlord (in the case of breach by the Tenant), the Tenant shall only be entitled to a refund of the rent and service charge for the unused days remaining on the tenancy from the day the Property is fully vacated, and possession returned to the Landlord.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Any refund due will be paid to the Tenant only after the Tenant has fully vacated the Property and returned possession to the Landlord.
            </li>
            <li className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
              Deductions may be made for damages beyond fair wear and tear or outstanding obligations.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] leading-[15px] text-[#1a1b23] font-bold mb-3">8. Entire Agreement</h3>
          <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify">
            This Agreement constitutes the entire agreement between the parties in relation to the Property and supersedes all prior discussions, representations or understandings, whether oral or written.
          </p>
        </div>

        <div>
          <h3 className="text-[12px] leading-[16px] text-[#1a1b23] font-bold uppercase underline mt-8 mb-3">
            Acceptance of Terms
          </h3>
          <p className="text-[11px] leading-[15px] text-[#1a1b23] text-justify mb-4">
            I, <span className="font-bold">EMMANUEL ETIM</span>, accept the above terms and conditions contained in this Tenancy Agreement dated April 24, 2026.
          </p>

          {acceptance && (
            <div className="border border-green-700/60 flex max-w-[420px]">
              <div className="w-[28%] flex items-center justify-center py-5 px-7 border-r border-green-700/60">
                <div className="relative rotate-[-14deg] border-[2.5px] border-green-700/70 rounded-full w-[100px] h-[100px] shrink-0 flex items-center justify-center select-none">
                  <div className="absolute inset-[5px] rounded-full border border-green-700/70 pointer-events-none" />
                  <span className="text-[13px] leading-none font-bold tracking-[0.14em] uppercase text-green-700/80">
                    Accepted
                  </span>
                </div>
              </div>

              <div className="flex-1 py-2 pl-3 pr-1">
                <h4 className="text-[11px] leading-[14px] text-[#1a1b23] font-bold underline mb-1.5">Digital Signature</h4>
                <div className="text-[10.5px] leading-[15px] text-[#1a1b23] text-left">
                  <div className="flex">
                    <span className="font-bold w-[70px] shrink-0">Date:</span>
                    <span>{acceptance.dateAccepted}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-[70px] shrink-0">Time:</span>
                    <span>{acceptance.timeAccepted}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-[70px] shrink-0">OTP:</span>
                    <span className="font-mono tracking-[0.18em] font-bold">
                      {/^\d{4,}$/.test(acceptance.signatureToken) ? acceptance.signatureToken : "738080"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-[70px] shrink-0">Phone No:</span>
                    <span>{acceptance.tenantPhone ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

      <div className="text-center mt-12 space-y-0">
        <p className="text-[10px] leading-[14px] text-[#1a1b23] font-bold">17 Ayinde Akinmade Street</p>
        <p className="text-[10px] leading-[14px] text-[#1a1b23] font-bold">Lekki Phase 1, Lagos State</p>
        <p className="text-[10px] leading-[14px] text-[#0066cc] underline">www.propertykraft.africa</p>
      </div>
    </div>
  );
}

function OfferLetterView({
  onAccept,
  onDecline,
  acceptance,
}: {
  onAccept: () => void;
  onDecline: () => void;
  acceptance?: AcceptanceDetails;
}) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - 2 * margin;

      doc.setFont("helvetica", "normal");

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal");
      doc.text("April 24, 2026", margin, y);
      y += lineHeight * 2;

      doc.setFont(undefined as any, "bold");
      doc.text("Emmanuel Etim", margin, y);
      y += lineHeight;
      doc.text("Plot 23, Providence Street", margin, y);
      y += lineHeight;
      doc.text("Lekki Phase 1", margin, y);
      y += lineHeight;
      doc.text("Lagos State", margin, y);
      y += lineHeight * 2;

      doc.setFont(undefined as any, "normal");
      doc.text("Dear Mr Etim,", margin, y);
      y += lineHeight * 2;

      doc.setFont(undefined as any, "bold");
      const subjectText =
        "RENT RENEWAL OFFER FOR RENT OF TWO BEDROOM FIRST FLOOR APARTMENT AT 17 AYINDE AKINMADE STREET, LEKKI PHASE 1 LAGOS";
      const splitSubject = doc.splitTextToSize(subjectText, contentWidth);
      doc.text(splitSubject, margin, y);
      y += lineHeight * splitSubject.length + lineHeight;

      doc.setFont(undefined as any, "normal");
      const introText =
        "This is to formally notify you that your tenancy over the two-bedroom apartment situate at 17 Ayinde Akinmade Street, Lekki Phase 1 which you currently occupy expires on the 10th of May 2026. Following the expiry of your tenancy, we hereby make you an offer to rent the apartment for another tenancy period upon the following terms:";
      const splitIntro = doc.splitTextToSize(introText, contentWidth);
      doc.text(splitIntro, margin, y);
      y += lineHeight * splitIntro.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("• Permitted Use: ", margin, y);
      doc.setFont(undefined as any, "normal");
      doc.text("Residential.", margin + 40, y);
      y += lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("• Rent: ", margin, y);
      doc.setFont(undefined as any, "normal");
      doc.text("N6,000,000", margin + 40, y);
      y += lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("• Service Charge: ", margin, y);
      doc.setFont(undefined as any, "normal");
      doc.text("N750,000", margin + 40, y);
      y += lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("• Tenancy Term: ", margin, y);
      doc.setFont(undefined as any, "normal");
      doc.text("One Year Fixed.", margin + 40, y);
      y += lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("• Tenancy Period: ", margin, y);
      doc.setFont(undefined as any, "normal");
      doc.text("May 11, 2026, to May 10, 2027", margin + 40, y);
      y += lineHeight * 2;

      const closingText =
        'This Rent Renewal Offer and the attached Terms of Tenancy (together the "Tenancy Agreement") shall govern the tenancy relationship between Panda Homes Nigeria Limited ("the Landlord") and you, Emmanuel Etim ("the Tenant") for the Tenancy Period.';
      const splitClosing = doc.splitTextToSize(closingText, contentWidth);
      doc.text(splitClosing, margin, y);
      y += lineHeight * splitClosing.length + lineHeight * 2;

      doc.text("Yours faithfully,", margin, y);
      y += lineHeight * 2;

      doc.setFont(undefined as any, "bold");
      doc.text("Olatunji Oginni", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "italic");
      doc.text("for Landlord", margin, y);
      y += lineHeight * 3;

      doc.addPage();
      y = margin;

      doc.setFont(undefined as any, "bold");
      doc.setFontSize(12);
      doc.text("TERMS OF TENANCY", margin, y);
      y += lineHeight * 2;

      doc.setFontSize(10);
      doc.text("1. Permitted Use", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term1 = doc.splitTextToSize(
        "The Property shall be used solely for residential purposes. Commercial use, Airbnb/short-let, or subletting is strictly prohibited.",
        contentWidth,
      );
      doc.text(term1, margin, y);
      y += lineHeight * term1.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("2. Conduct & Restrictions", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term2 = doc.splitTextToSize(
        "Pets must remain inside your apartment; pets in common areas are prohibited. You are not to cause to be done or permit any act or operation within the premises that is illegal or maybe considered a nuisance.",
        contentWidth,
      );
      doc.text(term2, margin, y);
      y += lineHeight * term2.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("3. Repairs & Maintenance", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term3 = doc.splitTextToSize(
        "Tenant shall be responsible for internal repairs & minor maintenance. Landlord shall be responsible for structural repairs and major building systems. Damage caused by Tenant negligence is Tenant's responsibility.",
        contentWidth,
      );
      doc.text(term3, margin, y);
      y += lineHeight * term3.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("4. Access", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term4 = doc.splitTextToSize(
        "The Landlord may access the Property with reasonable notice for inspections, repairs, or emergencies.",
        contentWidth,
      );
      doc.text(term4, margin, y);
      y += lineHeight * term4.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("5. Service of Notices", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term5 = doc.splitTextToSize(
        "Notices to the Tenant will be considered duly served if (1) affixed to the door of the Property; (2) sent via WhatsApp to 09069333649; or (3) sent via email to emmybass9@yahoo.com. The Tenant shall keep these contact details valid and promptly notify the Landlord of any change.",
        contentWidth,
      );
      doc.text(term5, margin, y);
      y += lineHeight * term5.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("6. Breach & Termination", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term6 = doc.splitTextToSize(
        "Non-compliance with these terms may result in disconnection from general utilities and services, termination, and/or eviction.",
        contentWidth,
      );
      doc.text(term6, margin, y);
      y += lineHeight * term6.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("7. Refunds", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term7 = doc.splitTextToSize(
        "If the tenancy is terminated before expiry, the Tenant shall only be entitled to a refund of the rent and service charge for the unused days remaining on the tenancy from the day the Property is fully vacated and possession returned to the Landlord. Any refund due will be paid only after vacating. Deductions may be made for damages beyond fair wear and tear or outstanding obligations.",
        contentWidth,
      );
      doc.text(term7, margin, y);
      y += lineHeight * term7.length + lineHeight;

      doc.setFont(undefined as any, "bold");
      doc.text("8. Entire Agreement", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const term8 = doc.splitTextToSize(
        "This Agreement constitutes the entire agreement between the parties in relation to the Property and supersedes all prior discussions, representations or understandings, whether oral or written.",
        contentWidth,
      );
      doc.text(term8, margin, y);
      y += lineHeight * term8.length + lineHeight * 2;

      doc.setFont(undefined as any, "bold");
      doc.text("ACCEPTANCE OF TERMS", margin, y);
      y += lineHeight;
      doc.setFont(undefined as any, "normal");
      const acceptanceLine = doc.splitTextToSize(
        "I, EMMANUEL ETIM, accept the above terms and conditions contained in this Tenancy Agreement dated April 24, 2026.",
        contentWidth,
      );
      doc.text(acceptanceLine, margin, y);
      y += lineHeight * acceptanceLine.length + lineHeight;

      doc.setFontSize(9);
      doc.setFont(undefined as any, "bold");
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.text("17 Ayinde Akinmade Street", pageWidth / 2, footerY, { align: "center" });
      doc.text("Lekki Phase 1, Lagos State", pageWidth / 2, footerY + 5, { align: "center" });
      doc.setFont(undefined as any, "normal");
      doc.text("www.propertykraft.africa", pageWidth / 2, footerY + 10, { align: "center" });

      doc.save("Rent_Renewal_Offer_Letter_Emmanuel_Etim.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const isAccepted = !!acceptance;

  return (
    <div className="min-h-screen bg-white">
      <div ref={documentRef} className="pb-8">
        <OfferLetterDocument acceptance={acceptance} />
      </div>

      <div className="px-3 sm:px-12 pb-12 overflow-x-hidden">
        {isAccepted ? (
          <div className="border border-green-200 bg-green-50 rounded-md px-4 py-3 mb-4 max-w-2xl">
            <p className="text-[11px] leading-[16px] text-green-800">
              This document has been digitally accepted and is legally binding.
            </p>
          </div>
        ) : (
          <p className="text-[11px] leading-[16px] text-gray-600 mb-4 max-w-2xl">
            By clicking &quot;Accept Renewal&quot;, you confirm that you have read, understood, and agree to the terms and conditions outlined in this renewal offer letter.
          </p>
        )}

        {!isAccepted && (
          <div className="flex flex-row gap-2 sm:gap-3 w-full sm:max-w-md">
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1 h-10 sm:h-9 px-2 sm:px-3 text-[13px] sm:text-sm whitespace-nowrap"
            >
              Decline Renewal
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-10 sm:h-9 px-2 sm:px-3 text-[13px] sm:text-sm whitespace-nowrap bg-[#FF5722] hover:bg-[#E64A19]"
            >
              Accept Renewal
            </Button>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-4 self-start text-[11px] sm:text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 text-left"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{isDownloading ? "Downloading..." : "Download renewal offer letter"}</span>
        </button>
      </div>
    </div>
  );
}

function DeclineConfirmation({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">Decline This Renewal?</h2>

          <p className="text-gray-600 mb-6">
            Are you sure you want to decline this renewal offer? This action cannot be undone.
          </p>

          <div className="flex gap-3 w-full">
            <Button onClick={onCancel} variant="outline" className="flex-1 h-11">
              Go Back
            </Button>
            <Button onClick={onConfirm} className="flex-1 h-11 bg-[#FF5722] hover:bg-[#E64A19]">
              Yes, Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OTPVerification({
  phoneNumber,
  onVerify,
  onBack,
}: {
  phoneNumber: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleVerify = React.useCallback(() => {
    if (otp.length === 6 && !isConfirmed) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setShowSuccessModal(true);
        setIsConfirmed(true);
      }, 1000);
    }
  }, [otp, isConfirmed]);

  useEffect(() => {
    if (otp.length === 6 && !isConfirmed) {
      handleVerify();
    }
  }, [otp, isConfirmed, handleVerify]);

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setOtp("");
    }, 2000);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    onVerify(otp);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center px-6 pt-16 pb-12 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Confirm Your Acceptance</h2>

        <p className="text-sm text-gray-600 mb-1 text-center">
          To proceed, please confirm your acceptance of this renewal offer.
        </p>

        <p className="text-sm text-gray-600 mb-8 text-center">
          This acts as your digital signature and verifies your identity.
        </p>

        <p className="text-xs text-gray-500 mb-4 text-center max-w-sm">
          The code sent to {phoneNumber} is used to confirm that you are the intended recipient of this renewal offer letter.
        </p>

        <div className="mb-12">
          <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} disabled={isConfirmed}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying || isConfirmed}
          className="w-full max-w-xs h-10 mb-6 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
        >
          {isVerifying ? "Confirming..." : isConfirmed ? "Confirmed" : "Confirm & Sign"}
        </Button>

        <button
          onClick={handleResend}
          disabled={isResending || isConfirmed}
          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
      </div>

      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={handleModalClose}
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Offer Confirmed 🎉</h2>

              <p className="text-sm text-gray-600 mb-2">Your acceptance has been recorded successfully.</p>

              <p className="text-sm text-gray-600 mb-2">
                An invoice and payment link will be sent to your WhatsApp shortly.
              </p>

              <p className="text-sm text-gray-600 mb-6">
                Please complete your payment to proceed with your tenancy.
              </p>

              <Button onClick={handleModalClose} className="w-full h-10 bg-[#FF5722] hover:bg-[#E64A19]">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentScreen({
  offerData,
  onPaymentSuccess,
  onClose,
}: {
  offerData: OfferData;
  onPaymentSuccess: () => void;
  onClose: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const rentAmount = offerData.rentAmount;
  const serviceCharge = offerData.serviceCharge;
  const totalAmount = rentAmount + serviceCharge;

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onPaymentSuccess();
    }, 1500);
  };

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Panda Homes</h1>
              <p className="text-sm text-gray-600">Landlord</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors -mr-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-t-2 border-gray-300 pt-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Payment Invoice</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tenant Name</p>
                <p className="text-sm text-gray-900 font-medium">{offerData.tenantName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date Issued</p>
                <p className="text-sm text-gray-900">{currentDate}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1">Property</p>
              <p className="text-sm text-gray-900 font-medium">{offerData.propertyName}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-gray-700">Rent</span>
                <span className="text-sm text-gray-900 font-medium">{formatCurrency(rentAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-gray-700">Service Charge</span>
                <span className="text-sm text-gray-900 font-medium">{formatCurrency(serviceCharge)}</span>
              </div>
            </div>

            <div className="border-t-2 border-gray-900 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-900">Total Amount Due</span>
                <span className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button
              onClick={handlePayNow}
              disabled={isProcessing}
              className="h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </Button>

            <p className="text-xs text-gray-500 mt-3">Secured by Paystack</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ type, amountPaid }: { type: "payment" | "declined"; amountPaid?: number }) {
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

  if (type === "declined") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Renewal Declined</h2>

            <p className="text-gray-600">You have declined this renewal offer.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Successful</h2>

          {amountPaid && (
            <>
              <p className="text-3xl font-semibold text-gray-900 mb-3">{formatCurrency(amountPaid)} paid</p>

              <p className="text-sm text-gray-600 mb-6">We&apos;ve successfully applied this payment to your rent.</p>
            </>
          )}

          <div className="bg-gray-50 rounded-lg p-4 w-full text-left">
            <p className="text-sm text-gray-600 mb-2">✓ Receipt has been generated</p>
            <p className="text-sm text-gray-600">✓ Landlord has been notified</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantRenewalAcceptanceFlow() {
  const [currentStep, setCurrentStep] = useState<FlowStep>("offer");
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptance, setAcceptance] = useState<AcceptanceDetails | null>(null);

  const loadOfferData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let offerId = urlParams.get("offerId");

      if (!offerId) {
        const pathMatch = window.location.pathname.match(/\/offer\/([^/]+)/);
        if (pathMatch) {
          offerId = pathMatch[1];
        }
      }

      if (!offerId) {
        offerId = "abc123";
      }

      const data = await fetchOfferData(offerId);
      setOfferData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferData();
  }, [loadOfferData]);

  const handleAccept = () => {
    setCurrentStep("otp");
  };

  const handleDecline = () => {
    setCurrentStep("decline-confirm");
  };

  const handleDeclineConfirm = () => {
    setCurrentStep("declined");
  };

  const handleDeclineCancel = () => {
    setCurrentStep("offer");
  };

  const handleOTPVerified = (otp: string) => {
    if (!offerData) return;
    const now = new Date();
    const dateAccepted = now.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeAccepted = now.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTimeSigned = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(
      now.getHours(),
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setAcceptance({
      tenantName: offerData.tenantName,
      dateAccepted,
      timeAccepted,
      dateTimeSigned,
      signatureToken: otp,
      tenantPhone: offerData.tenantPhone,
      tenantEmail: offerData.tenantEmail,
    });
    setCurrentStep("accepted");
  };

  const handlePaymentSuccess = () => {
    setCurrentStep("success");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Offer Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find this offer. Please check your link and try again.
            </p>
            <button
              onClick={loadOfferData}
              className="w-full h-11 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!offerData) {
    return null;
  }

  return (
    <div className="size-full">
      {currentStep === "offer" && <OfferLetterView onAccept={handleAccept} onDecline={handleDecline} />}

      {currentStep === "decline-confirm" && (
        <DeclineConfirmation onConfirm={handleDeclineConfirm} onCancel={handleDeclineCancel} />
      )}

      {currentStep === "declined" && <SuccessScreen type="declined" />}

      {currentStep === "otp" && (
        <OTPVerification phoneNumber={offerData.tenantPhone} onVerify={handleOTPVerified} onBack={handleDeclineCancel} />
      )}

      {currentStep === "accepted" && acceptance && (
        <OfferLetterView onAccept={() => {}} onDecline={() => {}} acceptance={acceptance} />
      )}

      {currentStep === "payment" && (
        <PaymentScreen offerData={offerData} onPaymentSuccess={handlePaymentSuccess} onClose={handleDeclineCancel} />
      )}

      {currentStep === "success" && (
        <SuccessScreen type="payment" amountPaid={offerData.rentAmount + offerData.serviceCharge} />
      )}
    </div>
  );
}
