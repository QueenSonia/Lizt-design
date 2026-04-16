"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_URL = "https://wa.me/2348036322847?text=Hello";
const ADDRESS = "17 Ayinde Akinmade Street, Lekki Phase 1, Lagos";
const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=17+Ayinde+Akinmade+Street+Lekki+Phase+1+Lagos";

/* ─── Image Carousel Slides ─── */
const slides = [
  { src: "/1.jpeg", alt: "Slide 1" },
  { src: "/2.jpeg", alt: "Slide 2" },
  { src: "/3.jpeg", alt: "Slide 3" },
  { src: "/4.jpeg", alt: "Slide 4" },
  { src: "/5.jpeg", alt: "Slide 5" },
];

const reasons = ["Demo", "Support", "General Inquiry"];

/* ─── Logo ─── */
function Logo() {
  return (
    <Link href="/">
      <Image
        src="/lizt.svg"
        alt="Lizt by Property Kraft"
        height={43}
        width={140}
        className="h-[30px] sm:h-[43px] w-auto object-contain"
        priority
      />
    </Link>
  );
}

/* ─── Desktop Nav ─── */
function DesktopNav() {
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

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="h-[80px] w-full max-w-[1440px] mx-auto hidden md:flex items-center py-[16px] px-10 lg:px-20">
        <div className="flex w-full justify-between items-center">
          <Logo />
          <button
            onClick={handleGetStarted}
            className="relative flex items-center justify-center px-[20px] py-[10px] rounded-[39px] cursor-pointer transition-all duration-300 hover:shadow-[0_4px_16px_rgba(254,80,1,0.3)] hover:scale-[1.02] active:scale-[0.98]"
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
  );
}

/* ─── Mobile Nav ─── */
function MobileNav() {
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

  return (
    <div className="md:hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo />
        <button
          onClick={handleGetStarted}
          className="relative flex items-center justify-center px-3.5 py-1.5 rounded-[39px] cursor-pointer transition-all duration-300 hover:shadow-[0_4px_16px_rgba(254,80,1,0.3)] active:scale-[0.98]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
          }}
        >
          <p className="font-['Inter',sans-serif] font-semibold leading-[20px] text-[12px] text-center text-white whitespace-nowrap">
            {isAuthenticated ? "Go to Dashboard" : "Client Login"}
          </p>
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
        </button>
      </div>
    </div>
  );
}

/* ─── Contact Hero with Image Carousel ─── */
function ContactHero({ onScrollToForm }: { onScrollToForm: () => void }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
      {/* Background carousel images */}
      {slides.map((slide, i) => (
        <Image
          key={slide.alt}
          src={slide.src}
          alt={slide.alt}
          fill
          className="absolute inset-0 object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.72) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Brand tint overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, rgba(254,80,1,0.22) 0%, rgba(254,80,1,0.14) 40%, rgba(254,80,1,0.06) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Faint system lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="hero-carousel-blur"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
        </defs>
        <path
          d="M -40 120 Q 300 200, 720 350 Q 1100 480, 1480 300"
          stroke="#fe5001"
          strokeWidth="2"
          opacity="0.07"
          filter="url(#hero-carousel-blur)"
        />
        <path
          d="M -20 500 Q 350 420, 720 350 Q 1050 290, 1480 440"
          stroke="#fe5001"
          strokeWidth="1.5"
          opacity="0.05"
          filter="url(#hero-carousel-blur)"
        />
        <path
          d="M 1480 150 Q 1100 230, 720 350 Q 380 450, -40 360"
          stroke="#fe5001"
          strokeWidth="1.5"
          opacity="0.06"
          filter="url(#hero-carousel-blur)"
        />
      </svg>

      {/* Content overlay */}
      <div className="absolute inset-0 z-[5] flex items-center">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 lg:px-20">
          <div
            className="max-w-[680px]"
            style={{
              textShadow:
                "0 2px 16px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            <h1 className="font-['Inter',sans-serif] font-semibold text-white text-[22px] leading-[28px] sm:text-[30px] sm:leading-[38px] md:text-[40px] md:leading-[48px] lg:text-[52px] lg:leading-[60px] tracking-[-0.5px] sm:tracking-[-1px] md:tracking-[-1.5px] mb-4 sm:mb-5 md:mb-6">
              Talk to us. Let&apos;s simplify your property management.
            </h1>
            <p className="font-['Inter',sans-serif] font-normal text-[rgba(255,255,255,0.85)] text-[13px] leading-[21px] sm:text-[15px] sm:leading-[25px] md:text-[18px] md:leading-[30px] max-w-[540px] mb-6 sm:mb-8 md:mb-10">
              From rent collection to tenant issues, Lizt helps you stay in
              control — all from one dashboard.
            </p>

            <div className="flex flex-row items-start gap-2 sm:gap-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-[39px] text-white cursor-pointer transition-all duration-300 hover:shadow-[0_6px_24px_rgba(254,80,1,0.45)] hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
                }}
              >
                <span className="font-['Inter',sans-serif] font-semibold text-[12px] sm:text-[15px] leading-[18px] sm:leading-[22px] whitespace-nowrap">
                  Chat on WhatsApp
                </span>
                <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
              </a>

              <button
                onClick={onScrollToForm}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-[39px] border border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.1)] backdrop-blur-sm text-white cursor-pointer transition-all duration-300 hover:bg-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.6)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] active:scale-[0.98]"
              >
                <span className="font-['Inter',sans-serif] font-semibold text-[12px] sm:text-[15px] leading-[18px] sm:leading-[22px] whitespace-nowrap">
                  Book a Demo
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-[6] flex gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.alt}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-400 cursor-pointer ${
              i === current
                ? "w-7 h-2.5 bg-[#fe5001]"
                : "w-2.5 h-2.5 bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.65)]"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Contact Section (Options + Form) ─── */
function ContactSection({
  nameInputRef,
}: {
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function scrollToForm() {
    nameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => nameInputRef.current?.focus(), 500);
  }

  const contactOptions = [
    {
      icon: (
        <MessageCircle className="size-6 text-[#fe5001]" strokeWidth={1.5} />
      ),
      title: "Chat on WhatsApp",
      description: "Get quick responses and support directly on WhatsApp.",
      cta: "Start Chat",
      action: () => window.open(WHATSAPP_URL, "_blank"),
    },
    {
      icon: <Mail className="size-6 text-[#fe5001]" strokeWidth={1.5} />,
      title: "Send an Email",
      description: "Reach out with detailed questions or requests.",
      cta: "Email Us",
      action: scrollToForm,
    },
    {
      icon: <MapPin className="size-6 text-[#fe5001]" strokeWidth={1.5} />,
      title: "Visit Us",
      description: ADDRESS,
      cta: "Open Map",
      action: () => window.open(MAP_URL, "_blank"),
    },
  ];

  const inputClass =
    "w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-[#e8e8e8] bg-white font-['Inter',sans-serif] font-normal text-[13px] sm:text-[15px] leading-[20px] sm:leading-[24px] text-[#171717] placeholder-[#a0a0a0] outline-none focus:border-[#fe5001] focus:ring-1 focus:ring-[#fe5001] transition-colors";

  return (
    <section className="w-full px-4 md:px-20 py-20 sm:py-24 md:py-24">
      <div className="max-w-[1200px] mx-auto flex flex-col-reverse lg:flex-row gap-24 sm:gap-28 lg:gap-14 items-start">
        {/* Left column — Contact options */}
        <div className="w-full lg:w-[35%] flex flex-col gap-5 lg:gap-6">
          {contactOptions.map((opt) => (
            <div
              key={opt.title}
              className="flex items-start gap-4 p-6 rounded-2xl border border-[#e8e8e8] bg-white hover:border-[#f5ede9] hover:bg-[#fef9f7] transition-colors"
            >
              <div className="flex items-center justify-center size-11 rounded-xl bg-[rgba(254,80,1,0.08)] shrink-0 mt-0.5">
                {opt.icon}
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h3 className="font-['Inter',sans-serif] font-semibold text-[#171717] text-[15px] sm:text-[17px] leading-[22px] sm:leading-[24px]">
                  {opt.title}
                </h3>
                <p className="font-['Inter',sans-serif] font-normal text-[#5f5f5f] text-[12px] sm:text-[14px] leading-[19px] sm:leading-[22px]">
                  {opt.description}
                </p>
                <button
                  onClick={opt.action}
                  className="mt-1 self-start font-['Inter',sans-serif] font-semibold text-[13px] leading-[20px] text-[#fe5001] hover:underline cursor-pointer"
                >
                  {opt.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right column — Form */}
        <div className="w-full lg:w-[65%]">
          {submitted ? (
            <div className="text-center py-16">
              <div className="flex items-center justify-center size-14 rounded-full bg-[rgba(254,80,1,0.08)] mx-auto mb-5">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fe5001"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-['Inter',sans-serif] font-semibold text-[#171717] text-[22px] leading-[30px] mb-2">
                Message Sent
              </h3>
              <p className="font-['Inter',sans-serif] font-normal text-[#5f5f5f] text-[15px] leading-[24px]">
                Thanks for reaching out. We&apos;ll get back to you shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-['Inter',sans-serif] font-semibold text-[#171717] text-[20px] sm:text-[24px] md:text-[28px] leading-[26px] sm:leading-[32px] md:leading-[36px] tracking-[-0.5px] mb-2">
                  Get in Touch
                </h2>
                <p className="font-['Inter',sans-serif] font-normal text-[#5f5f5f] text-[13px] sm:text-[15px] leading-[20px] sm:leading-[24px]">
                  Fill out the form below and we&apos;ll get back to you as soon
                  as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[13px] leading-[20px]">
                    Full Name
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[13px] leading-[20px]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[13px] leading-[20px]">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[13px] leading-[20px]">
                    Reason for Contact
                  </label>
                  <select
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    required
                    className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235f5f5f%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat cursor-pointer ${!form.reason ? "text-[#a0a0a0]" : ""}`}
                  >
                    <option value="" disabled>
                      Select a reason
                    </option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter',sans-serif] font-semibold text-[#282828] text-[13px] leading-[20px]">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                    rows={5}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-[14px] font-['Inter',sans-serif]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-2 w-full py-2.5 sm:py-3.5 rounded-[39px] text-white font-['Inter',sans-serif] font-semibold text-[13px] sm:text-[15px] leading-[20px] sm:leading-[22px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
                  }}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>

              <p className="mt-5 text-center font-['Inter',sans-serif] font-normal text-[#a0a0a0] text-[13px] leading-[20px]">
                We typically respond within 24 hours.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact CTA ─── */
function ContactCTA({ onScrollToForm }: { onScrollToForm: () => void }) {
  return (
    <section className="relative w-full bg-[#fafafa] py-20 sm:py-24 md:py-12 px-4 md:px-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] md:w-[900px] md:h-[480px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(254,80,1,0.07) 0%, rgba(254,80,1,0.025) 45%, transparent 72%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-[680px] mx-auto flex flex-col items-center text-center gap-3">
        <h2 className="font-['Inter',sans-serif] font-medium text-[#171717] text-[17px] sm:text-[20px] md:text-[26px] lg:text-[30px] leading-[24px] sm:leading-[28px] md:leading-[34px] lg:leading-[40px] tracking-[-0.5px]">
          Ready to manage your properties the smarter way?
        </h2>
        <p className="font-['Inter',sans-serif] font-normal text-[#5f5f5f] text-[13px] sm:text-[15px] md:text-[17px] leading-[20px] sm:leading-[24px] md:leading-[28px] max-w-[520px]">
          Join landlords using Lizt to collect rent, manage tenants, and stay in
          control.
        </p>
        <div className="flex flex-row items-center gap-2 sm:gap-3 mt-1">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-[39px] text-white cursor-pointer transition-all duration-300 hover:shadow-[0_6px_20px_rgba(254,80,1,0.35)] hover:scale-[1.03] active:scale-[0.98]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(254, 80, 1) 0%, rgb(254, 80, 1) 100%)",
            }}
          >
            <span className="font-['Inter',sans-serif] font-semibold text-[13px] sm:text-[15px] md:text-[16px] leading-[20px] sm:leading-[24px] whitespace-nowrap">
              Chat on WhatsApp
            </span>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.32),inset_0px_-1.5px_0px_0px_rgba(255,255,255,0.32)]" />
          </a>
          <button
            onClick={onScrollToForm}
            className="group inline-flex items-center justify-center px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-[39px] border border-[#e0e0e0] bg-white text-[#171717] cursor-pointer transition-all duration-200 hover:border-[#fe5001] hover:text-[#fe5001]"
          >
            <span className="font-['Inter',sans-serif] font-semibold text-[13px] sm:text-[15px] md:text-[16px] leading-[20px] sm:leading-[24px] whitespace-nowrap">
              Book a Demo
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Contact Page ─── */
export default function ContactPage() {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const scrollToForm = useCallback(() => {
    nameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => nameInputRef.current?.focus(), 500);
  }, []);

  return (
    <div className="bg-white flex flex-col items-center relative w-full min-h-screen">
      {/* Navigation */}
      <div className="relative z-10 w-full">
        <MobileNav />
        <DesktopNav />
      </div>

      {/* Hero */}
      <ContactHero onScrollToForm={scrollToForm} />

      {/* Contact Options + Form */}
      <ContactSection nameInputRef={nameInputRef} />

      {/* CTA */}
      <ContactCTA onScrollToForm={scrollToForm} />

      {/* Footer */}
      <div className="bg-white w-full border-t border-[rgba(0,0,0,0.05)] mt-auto">
        <div className="max-w-[1440px] mx-auto py-6 sm:py-8 px-4 md:px-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center">
              <Logo />
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
