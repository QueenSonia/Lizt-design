"use client";

export interface StampMetadata {
  // For ACCEPTED stamp - signature details
  signName?: string;
  otp?: string;
  dateTimeSigned?: string;
  phone?: string;
  // For PAID stamp
  paymentDate?: string;
}

interface DistressedStampProps {
  label: string;
  colorScheme: "dark" | "red" | "green";
  metadata?: StampMetadata;
  className?: string;
}

const COLOR_MAP = {
  dark: "#2D2D2D",
  red: "#D32F2F",
  green: "#28A745",
} as const;

export function DistressedStamp({
  label,
  colorScheme,
  metadata,
  className = "",
}: DistressedStampProps) {
  const color = COLOR_MAP[colorScheme];
  const filterId = `distressed-${label.toLowerCase()}`;

  const hasMetadata = metadata && Object.values(metadata).some(Boolean);

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${className}`}
    >
      <div className="flex flex-col items-center">
        {/* SVG filter definition */}
        <svg width="0" height="0" className="absolute">
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="5"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Stamp label */}
        <div
          className="transform -rotate-12"
          style={{ filter: `url(#${filterId})` }}
        >
          <div
            className="px-6 py-2 border-4 rounded-md text-center"
            style={{
              borderColor: color,
              color: color,
              opacity: 0.85,
            }}
          >
            <span className="text-3xl font-extrabold tracking-widest uppercase">
              {label}
            </span>
          </div>
        </div>

        {/* Metadata details table */}
        {hasMetadata && (
          <div
            className="mt-3 text-xs border rounded px-3 py-2 bg-white/80"
            style={{ borderColor: color, color: color }}
          >
            <table className="w-full">
              <tbody>
                {metadata.signName && (
                  <tr>
                    <td className="pr-2 font-semibold whitespace-nowrap py-0.5">
                      Sign Name:
                    </td>
                    <td className="py-0.5">{metadata.signName}</td>
                  </tr>
                )}
                {metadata.otp && (
                  <tr>
                    <td className="pr-2 font-semibold whitespace-nowrap py-0.5">
                      OTP:
                    </td>
                    <td className="py-0.5">{metadata.otp}</td>
                  </tr>
                )}
                {metadata.dateTimeSigned && (
                  <tr>
                    <td className="pr-2 font-semibold whitespace-nowrap py-0.5">
                      Date/Time Signed:
                    </td>
                    <td className="py-0.5">{metadata.dateTimeSigned}</td>
                  </tr>
                )}
                {metadata.phone && (
                  <tr>
                    <td className="pr-2 font-semibold whitespace-nowrap py-0.5">
                      Phone:
                    </td>
                    <td className="py-0.5">{metadata.phone}</td>
                  </tr>
                )}
                {metadata.paymentDate && (
                  <tr>
                    <td className="pr-2 font-semibold whitespace-nowrap py-0.5">
                      Payment Date:
                    </td>
                    <td className="py-0.5">{metadata.paymentDate}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
