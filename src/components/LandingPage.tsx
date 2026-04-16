"use client";
import { useState, useRef, useEffect, useCallback } from "react";

import {
  Plus,
  Minus,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Bell,
  Wrench,
  Building2,
  LayoutDashboard,
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  Clock,
  User,
  Home,
  CreditCard,
} from "lucide-react";

import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { svgPaths } from "./hero-svg-paths";

/* ─── Hero Background (exact match to Lizt.co reference) ─── */
function HeroBackgroundIllustration() {
  return (
    <>
      {/* Main decorative SVG pattern frame — positioned below hero text area */}
      <div className="absolute inset-[199px_0_58px_0] overflow-clip">
        <div className="-translate-x-1/2 absolute h-[701px] left-1/2 top-0 w-[1440px]">
          {/* Right half — mirrored curvy lines */}
          <div
            className="absolute flex inset-[2.35%_0.01%_-2.25%_49.93%] items-center justify-center opacity-[0.6] origin-right scale-x-[1.07]"
            style={{
              maskImage:
                "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.2) 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.2) 100%)",
            }}
          >
            <div className="-scale-y-100 flex-none h-[700.343px] rotate-180 w-[720.776px]">
              <div className="relative size-full">
                <svg
                  className="absolute block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 720.776 700.343"
                >
                  <defs>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="paint0_linear_71_381"
                      x1="709.903"
                      x2="13.9773"
                      y1="340.987"
                      y2="340.987"
                    >
                      <stop offset="0" stopColor="#FD4B28" stopOpacity="0" />
                      <stop
                        offset="0.15"
                        stopColor="#FE5001"
                        stopOpacity="0.5"
                      />
                      <stop
                        offset="0.45"
                        stopColor="#FD4C28"
                        stopOpacity="0.4"
                      />
                      <stop
                        offset="0.75"
                        stopColor="#FD4C28"
                        stopOpacity="0.15"
                      />
                      <stop offset="1" stopColor="#FD4C28" stopOpacity="0" />
                    </linearGradient>
                    <filter
                      id="glow_right"
                      x="-10%"
                      y="-10%"
                      width="120%"
                      height="120%"
                    >
                      <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="3"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    clipRule="evenodd"
                    d={svgPaths.heroPattern}
                    fill="url(#paint0_linear_71_381)"
                    fillRule="evenodd"
                    filter="url(#glow_right)"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* Left half — mirrored curvy lines */}
          <div
            className="absolute inset-[2.35%_49.95%_-2.25%_0] opacity-[0.6] origin-left scale-x-[1.07]"
            style={{
              maskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.2) 100%)",
              WebkitMaskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.2) 100%)",
            }}
          >
            <svg
              className="absolute block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 720.776 700.343"
            >
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="paint0_linear_71_375"
                  x1="709.903"
                  x2="13.9773"
                  y1="340.987"
                  y2="340.987"
                >
                  <stop offset="0" stopColor="#FD4B28" stopOpacity="0" />
                  <stop offset="0.15" stopColor="#FE5001" stopOpacity="0.5" />
                  <stop offset="0.45" stopColor="#FD4C28" stopOpacity="0.4" />
                  <stop offset="0.75" stopColor="#FD4C28" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#FD4C28" stopOpacity="0" />
                </linearGradient>
                <filter
                  id="glow_left"
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="3"
                    result="blur"
                  />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                clipRule="evenodd"
                d={svgPaths.heroPattern}
                fill="url(#paint0_linear_71_375)"
                fillRule="evenodd"
                filter="url(#glow_left)"
              />
            </svg>
          </div>
          {/* Soft radial glow behind center */}
          <div
            className="absolute w-[280px] h-[280px] rounded-full pointer-events-none"
            style={{
              left: "717px",
              top: "473px",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(254,80,1,0.1) 0%, rgba(254,80,1,0.04) 40%, rgba(254,80,1,0) 70%)",
            }}
          />
          {/* Central orange house icon */}
          <div className="absolute h-[93px] left-[670px] top-[427px] w-[94px]">
            <div className="-translate-x-1/2 absolute bg-[#fe5001] bottom-0 left-1/2 top-0 flex items-center justify-center p-[8px] rounded-[24px] w-[94px]">
              <div className="relative shrink-0 size-[54px]">
                <svg
                  className="absolute block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 54 54"
                >
                  <path d={svgPaths.p1110d580} fill="white" />
                </svg>
              </div>
            </div>
          </div>
          {/* Crimson house bubble */}
          <div className="absolute bg-[#af003a] size-[56px] left-[257.68px] rounded-full top-[281px] shadow-[0px_4px_16px_0px_rgba(175,0,58,0.25)]">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[33px]">
              <svg
                className="absolute block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 47.6791 47.6791"
              >
                <path d={svgPaths.p8d1ca00} fill="white" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Purple bell bubble */}
      <div className="absolute bg-[#1f0235] size-[56px] left-[1033px] overflow-clip rounded-full top-[705px] shadow-[0px_4px_16px_0px_rgba(31,2,53,0.3)]">
        <div className="absolute inset-[20.45%_20.45%_18.94%_18.94%] overflow-clip">
          <div className="absolute inset-[5.21%_5.21%_5.22%_9.38%]">
            <svg
              className="absolute block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 34.1652 35.8293"
            >
              <path
                clipRule="evenodd"
                d={svgPaths.p71caa80}
                fill="white"
                fillRule="evenodd"
              />
              <path
                clipRule="evenodd"
                d={svgPaths.p34f96180}
                fill="white"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Red people bubble */}
      <div className="absolute bg-[#ef0303] size-[56px] left-[387px] overflow-clip rounded-full top-[629px] shadow-[0px_4px_16px_0px_rgba(239,3,3,0.25)]">
        <div className="absolute inset-[22.73%_18.18%_21.21%_16.67%]">
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 43 37"
          >
            <path d={svgPaths.p3f4a0200} fill="white" />
          </svg>
        </div>
      </div>
      {/* Dark blue money bubble */}
      <div className="absolute bg-[#1b2336] size-[58px] left-[198px] rounded-full top-[759px] shadow-[0px_4px_16px_0px_rgba(27,35,54,0.3)]">
        <div className="absolute left-0 overflow-clip size-full top-0">
          <div className="absolute inset-[14.71%_24.72%_15.44%_23.53%]">
            <svg
              className="absolute block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 35.1874 47.5042"
            >
              <g>
                <path
                  clipRule="evenodd"
                  d={svgPaths.p7513480}
                  fill="white"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p18d78980}
                  fill="white"
                  fillRule="evenodd"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
      {/* White documents bubble */}
      <div className="absolute bg-white size-[64px] left-[1096.5px] rounded-full shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] top-[568px]">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[33px] left-1/2 overflow-clip top-1/2 w-[35px]">
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 48 45"
          >
            <path d={svgPaths.p7779b00} fill="#AF003A" />
            <path d={svgPaths.p18a10080} fill="#AF003A" />
            <path d={svgPaths.p25858200} fill="#AF003A" />
            <path d={svgPaths.p2b57b280} fill="#AF003A" />
          </svg>
        </div>
      </div>
      {/* White maintenance bubble */}
      <div className="absolute bg-white size-[64px] left-[1261.5px] rounded-full shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] top-[428px]">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[38px] top-1/2">
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 50 50"
          >
            <g clipPath="url(#clip0_hero_wrench)">
              <path d={svgPaths.p38e00900} fill="#3A7326" />
            </g>
            <defs>
              <clipPath id="clip0_hero_wrench">
                <rect fill="white" height="50" width="50" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </>
  );
}

function HeroBackground() {
  const [scale, setScale] = useState(1);
  const [yOffset, setYOffset] = useState(0);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      setScale(Math.min(vw / 1440, 1));
      // On smaller screens, push the illustration down slightly so it doesn't overlap hero text.
      // At 1440px+ → 0px offset, at 768px → ~26px, at 375px → ~65px
      if (vw < 1024) {
        setYOffset(Math.round((1024 - vw) * 0.12));
      } else {
        setYOffset(0);
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-hidden pointer-events-none">
      {/*
        Single fluid-scaling container: the illustration is authored at 1440×858.
        We scale it proportionally to the viewport so it looks identical on every
        screen size — phones, tablets, and desktops.
        On smaller screens, the illustration shifts downward to avoid overlapping hero text.
      */}
      <div
        className="absolute"
        style={{
          width: 1440,
          height: 858,
          left: "50%",
          top: "50%",
          marginLeft: -720,
          marginTop: -429 + yOffset,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <HeroBackgroundIllustration />
      </div>
    </div>
  );
}

/* ─── Dashboard Overlay (for features image area) ─── */
function DashboardOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-[88%] lg:w-[560px] h-[82%] lg:h-[370px] flex gap-3 sm:gap-4 pointer-events-auto">
        {/* Left panel - Tenant List */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-[12px] sm:rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-3 sm:p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="size-5 sm:size-6 rounded-[6px] bg-[#fe5001]/10 flex items-center justify-center">
                <User
                  className="size-3 sm:size-3.5 text-[#fe5001]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="font-semibold text-[#282828] text-[10px] sm:text-[11px]">
                Tenants
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-[#5f6980]">
              12 active
            </span>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 flex-1">
            {[
              {
                name: "Adebayo O.",
                unit: "Unit 3A",
                status: "verified" as const,
              },
              {
                name: "Chioma N.",
                unit: "Unit 1B",
                status: "verified" as const,
              },
              { name: "Emeka I.", unit: "Unit 5C", status: "pending" as const },
              {
                name: "Fatima A.",
                unit: "Unit 2D",
                status: "verified" as const,
              },
              { name: "Grace M.", unit: "Unit 4A", status: "pending" as const },
            ].map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 py-1 sm:py-1.5 border-b border-[#f0f0f0] last:border-0"
              >
                <div className="size-5 sm:size-6 rounded-full bg-[#fafafa] flex items-center justify-center shrink-0">
                  <User
                    className="size-2.5 sm:size-3 text-[#5f6980]"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-[#282828] text-[9px] sm:text-[10px] truncate">
                    {t.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Home
                      className="size-2 sm:size-2.5 text-[#5f6980]"
                      strokeWidth={1.5}
                    />
                    <span className="text-[7px] sm:text-[8px] text-[#5f6980]">
                      {t.unit}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[7px] sm:text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                    t.status === "verified"
                      ? "bg-[#e8f5e9] text-[#2e7d32]"
                      : "bg-[#fff3e0] text-[#e65100]"
                  }`}
                >
                  {t.status === "verified" ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - KYC & Rent */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
          {/* KYC Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[12px] sm:rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-3 sm:p-4 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <div className="size-5 sm:size-6 rounded-[6px] bg-[#fe5001]/10 flex items-center justify-center">
                <CheckCircle
                  className="size-3 sm:size-3.5 text-[#fe5001]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="font-semibold text-[#282828] text-[10px] sm:text-[11px]">
                KYC Status
              </span>
            </div>
            <div className="mb-2 sm:mb-2.5">
              <div className="flex justify-between mb-1">
                <span className="text-[8px] sm:text-[9px] text-[#5f6980]">
                  Completed
                </span>
                <span className="text-[8px] sm:text-[9px] text-[#fe5001] font-semibold">
                  83%
                </span>
              </div>
              <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className="h-full w-[83%] rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #fb432c, #ff591e)",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { label: "ID Verification", done: true },
                { label: "Address Proof", done: true },
                { label: "Selfie Match", done: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div
                    className={`size-3 sm:size-3.5 rounded-full flex items-center justify-center ${s.done ? "bg-[#e8f5e9]" : "bg-[#f5f5f5]"}`}
                  >
                    {s.done ? (
                      <CheckCircle
                        className="size-2 sm:size-2.5 text-[#2e7d32]"
                        strokeWidth={2}
                      />
                    ) : (
                      <Clock
                        className="size-2 sm:size-2.5 text-[#9e9e9e]"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[8px] sm:text-[9px] ${s.done ? "text-[#282828]" : "text-[#9e9e9e]"}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rent Tracking Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[12px] sm:rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-3 sm:p-4 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <div className="size-5 sm:size-6 rounded-[6px] bg-[#fe5001]/10 flex items-center justify-center">
                <CreditCard
                  className="size-3 sm:size-3.5 text-[#fe5001]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="font-semibold text-[#282828] text-[10px] sm:text-[11px]">
                Rent Tracking
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {[
                { unit: "Unit 3A", amount: "₦450K", status: "paid" as const },
                { unit: "Unit 1B", amount: "₦380K", status: "paid" as const },
                {
                  unit: "Unit 5C",
                  amount: "₦500K",
                  status: "overdue" as const,
                },
              ].map((r) => (
                <div
                  key={r.unit}
                  className="flex items-center justify-between py-0.5 sm:py-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Home
                      className="size-2.5 sm:size-3 text-[#5f6980]"
                      strokeWidth={1.5}
                    />
                    <span className="text-[8px] sm:text-[9px] text-[#282828]">
                      {r.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] sm:text-[9px] text-[#282828] font-semibold">
                      {r.amount}
                    </span>
                    <span
                      className={`text-[7px] sm:text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                        r.status === "paid"
                          ? "bg-[#e8f5e9] text-[#2e7d32]"
                          : "bg-[#fce4ec] text-[#c62828]"
                      }`}
                    >
                      {r.status === "paid" ? "Paid" : "Overdue"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Accordion Item ─── */
function AccordionItem({
  item,
  isOpen,
  onToggle,
  showSeparator = true,
}: {
  item: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
  showSeparator?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div>
      <div
        className={`rounded-xl transition-all duration-300 ${
          isOpen
            ? "bg-[#fef9f7] border border-[#f5ede9]"
            : "bg-transparent border border-transparent hover:bg-[#fafafa]"
        }`}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-4 px-4 md:px-5 py-4 md:py-5 text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <h3
              className={`font-['DM_Sans',sans-serif] font-medium text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-[20px] sm:leading-[24px] md:leading-[26px] lg:leading-[28px] transition-colors duration-200 ${
                isOpen
                  ? "text-[#fe5001]"
                  : "text-[#141513] group-hover:text-[#fe5001]"
              }`}
              style={{ fontVariationSettings: "'opsz' 14" }}
            >
              {item.question}
            </h3>
          </div>
          <div
            className={`flex items-center justify-center size-6 md:size-7 rounded-full shrink-0 transition-all duration-300 ${
              isOpen
                ? "border border-[rgba(254,80,1,0.3)] bg-[rgba(254,80,1,0.08)]"
                : "border border-[#e0e0e0] group-hover:border-[rgba(254,80,1,0.4)]"
            }`}
          >
            <div
              className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
            >
              {isOpen ? (
                <Minus
                  className="size-3.5 md:size-4 text-[#fe5001]"
                  strokeWidth={2}
                />
              ) : (
                <Plus
                  className="size-3.5 md:size-4 text-[#5f6980] group-hover:text-[#fe5001] transition-colors duration-200"
                  strokeWidth={2}
                />
              )}
            </div>
          </div>
        </button>
        <div
          className="overflow-hidden transition-[height] duration-300 ease-in-out"
          style={{ height }}
        >
          <div ref={contentRef}>
            <p className="font-['Inter',sans-serif] font-normal text-[#7a7f75] text-[12px] sm:text-[13px] md:text-[15px] leading-[19px] sm:leading-[21px] md:leading-[25px] pb-3 sm:pb-4 md:pb-5 px-4 md:px-5">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
      {showSeparator && (
        <div className="mx-4 md:mx-5 border-b border-[#e8e8e8]" />
      )}
    </div>
  );
}

/* ─── CTA Background Lines ─── */
function CTABackgroundLines() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <filter id="cta-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>
        <path
          d="M -80 40 Q 150 60, 350 180 Q 500 260, 600 200"
          stroke="#fe5001"
          strokeWidth="2.5"
          opacity="0.15"
          filter="url(#cta-glow)"
        />
        <path
          d="M -60 120 Q 120 140, 320 200 Q 480 240, 600 200"
          stroke="#fe5001"
          strokeWidth="2"
          opacity="0.1"
          filter="url(#cta-glow)"
        />
        <path
          d="M -40 340 Q 140 310, 340 230 Q 490 180, 600 200"
          stroke="#fe5001"
          strokeWidth="2.5"
          opacity="0.13"
          filter="url(#cta-glow)"
        />
        <path
          d="M 1280 30 Q 1050 50, 850 180 Q 700 260, 600 200"
          stroke="#fe5001"
          strokeWidth="2.5"
          opacity="0.15"
          filter="url(#cta-glow)"
        />
        <path
          d="M 1260 130 Q 1080 150, 880 200 Q 720 240, 600 200"
          stroke="#fe5001"
          strokeWidth="2"
          opacity="0.1"
          filter="url(#cta-glow)"
        />
        <path
          d="M 1240 350 Q 1060 320, 860 230 Q 710 180, 600 200"
          stroke="#fe5001"
          strokeWidth="2.5"
          opacity="0.13"
          filter="url(#cta-glow)"
        />
        <circle
          cx="600"
          cy="200"
          r="80"
          fill="#fe5001"
          opacity="0.06"
          filter="url(#cta-glow)"
        />
      </svg>
    </div>
  );
}

/* ─── Feature Section ─── */
function FeatureSection({
  badge,
  title,
  description,
  features,
  bulletList,
  imageOverlay,
  reversed = false,
  imageSrc,
}: {
  badge: React.ReactNode;
  title: string;
  description?: string;
  features?: { icon: React.ReactNode; text: string }[];
  bulletList?: { icon: React.ReactNode; text: string }[];
  imageOverlay?: React.ReactNode;
  reversed?: boolean;
  imageSrc?: string;
}) {
  const content = (
    <div className="flex flex-col gap-5 sm:gap-6 md:gap-10 w-full lg:w-[547px] lg:shrink-0">
      <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 items-start">
        {badge}
        <h2 className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[20px] sm:text-[24px] md:text-[32px] lg:text-[44px] leading-[26px] sm:leading-[30px] md:leading-[38px] lg:leading-[52px] tracking-[-0.5px] md:tracking-[-1px] lg:tracking-[-1.5px] max-w-full">
          {title}
        </h2>
      </div>

      {description && (
        <p className="font-['Inter',sans-serif] font-normal text-[#5f6980] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] sm:leading-[22px] md:leading-[26px] lg:leading-[30px] whitespace-pre-wrap">
          {description}
        </p>
      )}

      {bulletList && (
        <ul className="flex flex-col gap-0">
          {bulletList.map((item, index) => (
            <li
              key={index}
              className={`flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 md:py-3.5${index !== 0 ? " border-t border-[#f0f0f0]" : ""}`}
            >
              <div className="flex items-center justify-center size-5 sm:size-6 shrink-0 text-[#fe5001]">
                {item.icon}
              </div>
              <span className="font-['Inter',sans-serif] font-normal text-[#6e6e6e] text-[12px] sm:text-[14px] md:text-[16px] leading-[18px] sm:leading-[22px] md:leading-[26px]">
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {features && (
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 sm:gap-3 rounded-[10px] sm:rounded-[14px] px-2.5 sm:px-4 py-2.5 sm:py-3.5 flex-1 min-w-0"
            >
              <div className="flex items-center justify-center size-7 sm:size-9 rounded-[8px] sm:rounded-[10px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] shrink-0 text-[#fe5001]">
                {feature.icon}
              </div>
              <p className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[11px] sm:text-[12px] md:text-[13px] leading-[16px] sm:leading-[18px] whitespace-nowrap">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageContent = (
    <div className="relative bg-[#fafafa] rounded-[16px] md:rounded-[24px] overflow-hidden w-full lg:w-[656px] lg:shrink-0 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[477px] flex items-center justify-center">
      {imageSrc ? (
        <div className="relative w-[90%] lg:w-[612px] h-[85%] lg:h-[408px] rounded-[12px] md:rounded-[16px] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 612px"
          />
        </div>
      ) : (
        <div className="w-[90%] lg:w-[612px] h-[85%] lg:h-[408px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-[12px] md:rounded-[16px] flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <LayoutDashboard className="size-12 mx-auto mb-2 opacity-30" />
          </div>
        </div>
      )}
      {imageOverlay}
    </div>
  );

  return (
    <div className="bg-white w-full py-20 sm:py-24 md:py-16 lg:py-[88px] px-4 sm:px-6 md:px-10 lg:px-[77px]">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 md:gap-10 lg:gap-[77px] items-center justify-center max-w-[1440px] mx-auto">
        {reversed ? (
          <>
            {imageContent}
            {content}
          </>
        ) : (
          <>
            {content}
            {imageContent}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Badge Component ─── */
function GradientBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center px-[14px] py-[4px] rounded-[100px]"
      style={{
        backgroundImage:
          "linear-gradient(-14.6deg, rgb(251, 67, 44) 0%, rgb(255, 89, 30) 100%)",
      }}
    >
      <span className="font-['Inter',sans-serif] font-semibold leading-[18px] sm:leading-[22px] text-[11px] sm:text-[13px] md:text-[14px] text-center text-white whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export function LandingPage() {
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated && user?.role) {
      const initialScreen = user.role === "admin" ? "reports" : "dashboard";
      router.push(`/${user.role}/${initialScreen}`);
    } else {
      router.push("/signin");
    }
  };

  const handleToggleFAQ = useCallback((index: number) => {
    setOpenFAQIndex((prev) => (prev === index ? null : index));
  }, []);

  const faqItems = [
    {
      question: "What is Lizt?",
      answer:
        "Lizt is a WhatsApp-powered property management platform that helps landlords and property managers handle tenants, rent, and maintenance issues from one dashboard.",
    },
    {
      question: "Do tenants need to download an app?",
      answer:
        "No. Tenants interact with Lizt entirely on WhatsApp. There's nothing to install or learn.",
    },
    {
      question: "Who can use Lizt?",
      answer:
        "Lizt is designed for landlords, property managers, estates, and facility teams managing one or multiple properties.",
    },
    {
      question: "Can Lizt send rent reminders?",
      answer:
        "Yes. Lizt sends automated rent reminders to tenants on WhatsApp and keeps records visible to admins.",
    },
    {
      question: "Is Lizt secure?",
      answer:
        "Yes. Lizt is built with security in mind to ensure tenant data, messages, and records are protected.",
    },
    {
      question: "Can facility managers use Lizt too?",
      answer:
        "Yes. Facility managers receive and handle maintenance requests directly on WhatsApp, without admin intervention.",
    },
    {
      question: "Does Lizt work for multiple properties?",
      answer:
        "Absolutely. You can manage multiple properties and tenants from one central dashboard.",
    },
    {
      question: "Is Lizt available outside Nigeria?",
      answer:
        "Lizt is built for African property management and continues to expand to support more regions.",
    },
  ];

  const midpoint = Math.ceil(faqItems.length / 2);
  const leftFAQs = faqItems.slice(0, midpoint);
  const rightFAQs = faqItems.slice(midpoint);

  return (
    <div className="bg-white flex flex-col items-center relative w-full min-h-screen">
      <Head>
        <title>Lizt - Smarter Rent & Tenancy Management</title>
        <link rel="canonical" href="https://www.lizt.co/" key="canonical" />
        <meta
          name="description"
          content="Lizt is a free digital tenancy management service developed by Property Kraft that keeps tenancies simple, transparent, and stress-free for landlords and tenants"
        />
      </Head>

      {/* ─── Hero Section ─── */}
      <div className="bg-white relative w-full min-h-[400px] sm:min-h-[470px] md:h-[958px] overflow-clip">
        <HeroBackground />

        {/* Navigation */}
        <div className="relative z-20 pointer-events-auto">
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between w-full px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex-shrink-0">
              <Image
                src="/lizt.svg"
                alt="Lizt by Property Kraft"
                height={43}
                width={140}
                className="h-[30px] sm:h-[43px] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-white">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/lizt.svg"
                    alt="Lizt by Property Kraft"
                    height={43}
                    width={140}
                    className="h-[30px] sm:h-[43px] w-auto object-contain"
                  />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
                  <a
                    href="#experience"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#282828] hover:text-[#fe5001] transition-colors"
                  >
                    Experience
                  </a>
                  <a
                    href="#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#282828] hover:text-[#fe5001] transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="https://propertykraft.africa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#282828] hover:text-[#fe5001] transition-colors"
                  >
                    Property Kraft
                  </a>
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setMobileMenuOpen(false);
                    }}
                    className="relative flex items-center justify-center px-5 py-2.5 rounded-[39px] cursor-pointer transition-all duration-300 hover:shadow-[0_4px_16px_rgba(254,80,1,0.3)] active:scale-[0.98]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
                    }}
                  >
                    <p className="font-['Inter',sans-serif] font-semibold leading-[20px] text-[14px] text-center text-white whitespace-nowrap">
                      {isAuthenticated ? "Go to Dashboard" : "Client Login"}
                    </p>
                    <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="absolute flex-col h-[80px] items-center justify-center py-[16px] top-0 w-full max-w-[1440px] left-1/2 -translate-x-1/2 hidden md:flex z-20 px-10 lg:px-20 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex w-full justify-between items-center relative">
              <Image
                src="/lizt.svg"
                alt="Lizt by Property Kraft"
                height={43}
                width={140}
                className="h-[43px] w-auto object-contain"
              />
              <div className="flex items-center gap-8">
                <a
                  href="#experience"
                  className="font-['Inter',sans-serif] font-semibold leading-[24px] text-[#282828] text-[14px] whitespace-nowrap hover:text-[#fe5001] transition-colors"
                >
                  Experience
                </a>
                <a
                  href="#features"
                  className="font-['Inter',sans-serif] font-semibold leading-[24px] text-[#282828] text-[14px] whitespace-nowrap hover:text-[#fe5001] transition-colors"
                >
                  Features
                </a>
                <a
                  href="https://propertykraft.africa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-['Inter',sans-serif] font-semibold leading-[24px] text-[#282828] text-[14px] whitespace-nowrap hover:text-[#fe5001] transition-colors"
                >
                  Property Kraft
                </a>
              </div>
              <button
                onClick={handleGetStarted}
                className="relative content-stretch flex items-center justify-center px-[20px] py-[10px] rounded-[39px] shrink-0 cursor-pointer transition-all duration-300 hover:shadow-[0_4px_16px_rgba(254,80,1,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%), linear-gradient(90deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 100%)",
                }}
              >
                <p className="font-['Inter',sans-serif] font-semibold leading-[24px] text-[14px] text-center text-white whitespace-nowrap">
                  {isAuthenticated ? "Go to Dashboard" : "Client Login"}
                </p>
                <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 md:px-0 pt-14 sm:pt-16 md:pt-[173px] pb-10 sm:pb-16 md:pb-0 pointer-events-auto">
          <div className="max-w-full md:max-w-[1192px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-center">
              <h1 className="font-['Inter',sans-serif] font-semibold text-[#171717] text-[22px] leading-[28px] sm:text-[32px] sm:leading-[38px] md:text-[48px] md:leading-[54px] lg:text-[72px] lg:leading-[78px] tracking-[-1px] sm:tracking-[-1.5px] lg:tracking-[-3.5px] max-w-full md:max-w-[1192px] px-4 md:px-0">
                Manage tenants, rent, and issues — effortlessly.
              </h1>
              <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center text-[#a3a3a3] tracking-[-0.14px]">
                <p className="leading-[20px] text-center md:text-left">
                  Tenants chat on WhatsApp. You stay in control from one
                  dashboard.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-[8px] items-center justify-center mt-4 sm:mt-6 text-[12px] sm:text-[13px] md:text-[14px] px-4 md:px-0">
              <button
                onClick={() => router.push("/contact")}
                className="flex flex-col font-['Inter',sans-serif] justify-center text-[#525252] cursor-pointer hover:text-[#fe5001] transition-colors"
              >
                <p className="font-semibold">
                  <span className="leading-[20px] tracking-[-0.16px] underline underline-offset-2">
                    Get in touch
                  </span>
                  <span className="leading-[20px] animate-pulse">{` →`}</span>
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Feature Section 1: Experience ─── */}
      <div id="experience" />
      <FeatureSection
        badge={<GradientBadge label="EXPERIENCE" />}
        title="Property management, as simple as a chat."
        description={`Tenants report issues, receive rent reminders, and complete onboarding directly on WhatsApp.\n Lizt automatically organizes everything into your dashboard — no chasing, no spreadsheets.`}
        features={[
          {
            icon: <MessageCircle className="size-[18px]" strokeWidth={1.5} />,
            text: "WhatsApp-first",
          },
          {
            icon: <ShieldCheck className="size-[18px]" strokeWidth={1.5} />,
            text: "Secure",
          },
          {
            icon: <Smartphone className="size-[18px]" strokeWidth={1.5} />,
            text: "No apps required",
          },
        ]}
        imageSrc="/smiling-man.jpeg"
      />

      {/* ─── Feature Section 2: Features ─── */}
      <div id="features" />
      <FeatureSection
        badge={<GradientBadge label="FEATURES" />}
        title="Manage properties as easily as sending a WhatsApp message."
        bulletList={[
          {
            icon: <UserPlus className="size-5" strokeWidth={1.5} />,
            text: "Tenant onboarding & KYC via WhatsApp",
          },
          {
            icon: <Bell className="size-5" strokeWidth={1.5} />,
            text: "Automated rent reminders & tracking",
          },
          {
            icon: <Wrench className="size-5" strokeWidth={1.5} />,
            text: "Maintenance issues logged instantly",
          },
          {
            icon: <Building2 className="size-5" strokeWidth={1.5} />,
            text: "Facility managers handle requests on WhatsApp",
          },
          {
            icon: <LayoutDashboard className="size-5" strokeWidth={1.5} />,
            text: "Central admin dashboard for full visibility",
          },
        ]}
        reversed
        imageSrc="/background.jpeg"
        imageOverlay={<DashboardOverlay />}
      />

      {/* ─── FAQ Section ─── */}
      <div className="bg-white w-full py-24 sm:py-28 md:py-32 px-4 md:px-10">
        <div className="max-w-[1204px] mx-auto flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <div className="flex flex-col gap-4 md:gap-5 max-w-full md:max-w-[700px]">
            <p className="font-['Inter',sans-serif] font-medium text-[#fe5001] text-[12px] sm:text-[14px] md:text-[16px] tracking-[1px] uppercase">
              FAQ
            </p>
            <h2
              className="font-['DM_Sans',sans-serif] font-bold text-[#141513] text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px] md:text-[40px] md:leading-[48px] lg:text-[48px] lg:leading-[56px]"
              style={{ fontVariationSettings: "'opsz' 14" }}
            >
              Frequently asked questions
            </h2>
            <p className="font-['Inter',sans-serif] font-normal text-[#51564e] text-[13px] leading-[20px] sm:text-[14px] sm:leading-[22px] md:text-[16px] md:leading-[26px] opacity-80">
              Everything you need to know about using Lizt.
            </p>
          </div>

          {/* Two columns on desktop */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            <div className="flex flex-col">
              {leftFAQs.map((item, index) => (
                <AccordionItem
                  key={index}
                  item={item}
                  isOpen={openFAQIndex === index}
                  onToggle={() => handleToggleFAQ(index)}
                  showSeparator={index < leftFAQs.length - 1}
                />
              ))}
            </div>
            <div className="flex flex-col">
              {rightFAQs.map((item, index) => {
                const actualIndex = midpoint + index;
                return (
                  <AccordionItem
                    key={actualIndex}
                    item={item}
                    isOpen={openFAQIndex === actualIndex}
                    onToggle={() => handleToggleFAQ(actualIndex)}
                    showSeparator={index < rightFAQs.length - 1}
                  />
                );
              })}
            </div>
          </div>

          {/* Single column on mobile */}
          <div className="md:hidden flex flex-col">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                item={item}
                isOpen={openFAQIndex === index}
                onToggle={() => handleToggleFAQ(index)}
                showSeparator={index < faqItems.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA Section ─── */}
      <div className="relative bg-[#fafafa] w-full py-20 sm:py-24 md:py-14 px-4 md:px-10 overflow-hidden">
        <CTABackgroundLines />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] md:w-[800px] md:h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(254,80,1,0.08) 0%, rgba(254,80,1,0.03) 40%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-[720px] mx-auto flex flex-col items-center text-center gap-2.5 md:gap-3">
          <p
            className="font-['DM_Sans',sans-serif] font-medium text-[#141513] text-[18px] sm:text-[22px] md:text-[28px] lg:text-[32px] leading-[24px] sm:leading-[30px] md:leading-[38px] lg:leading-[42px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Start collecting rent the smarter way.
          </p>
          <p className="font-['Inter',sans-serif] font-normal text-[#525252] text-[13px] sm:text-[15px] md:text-[17px] leading-[20px] sm:leading-[24px] md:leading-[28px] max-w-[520px]">
            Manage tenants, collect rent, and handle issues — all from one
            simple dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push("/contact")}
              className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[39px] text-white cursor-pointer transition-all duration-300 hover:shadow-[0_6px_20px_rgba(254,80,1,0.35)] hover:scale-[1.03] active:scale-[0.98]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
              }}
            >
              <span className="font-['Inter',sans-serif] font-semibold text-[13px] sm:text-[15px] md:text-[16px] leading-[20px] sm:leading-[24px] whitespace-nowrap">
                Book a Demo
              </span>
              <ArrowRight
                className="size-3.5 sm:size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
              <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
            </button>
          </div>
          <p className="font-['Inter',sans-serif] font-normal text-[#8a8a8a] text-[11px] sm:text-[13px] leading-[18px] sm:leading-[20px]">
            No apps for tenants. Works directly on WhatsApp.
          </p>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="bg-white w-full border-t border-[rgba(0,0,0,0.05)]">
        <div className="max-w-[1440px] mx-auto py-6 sm:py-8 px-4 md:px-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center">
              <Image
                src="/lizt.svg"
                alt="Lizt by Property Kraft"
                height={43}
                width={140}
                className="h-[32px] sm:h-[43px] w-auto object-contain"
              />
            </div>
            <p className="font-['Inter',sans-serif] font-normal text-[#5f6980] text-[12px] sm:text-[14px] text-center leading-[18px] sm:leading-[22px]">
              © 2024 Lizt. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <a
                href="#"
                className="font-['Inter',sans-serif] font-normal text-[#5f6980] text-[12px] sm:text-[14px] hover:text-[#fe5001] transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="font-['Inter',sans-serif] font-normal text-[#5f6980] text-[12px] sm:text-[14px] hover:text-[#fe5001] transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
