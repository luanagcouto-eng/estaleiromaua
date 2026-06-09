"use client";

interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
}

function ringColor(pct: number): string {
  if (pct >= 90) return "#364B59";
  if (pct >= 61) return "#F18213";
  if (pct >= 31) return "#F7A84E";
  return "#FDDCB0";
}

export default function ProgressRing({ pct, size = 64, stroke = 6, label }: ProgressRingProps) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = ringColor(clamped);
  const cx = size / 2;

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progresso: ${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <circle cx={cx} cy={cx} r={radius} stroke="#F1F3F5" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size * 0.2, color }}>
          {clamped}%
        </span>
        {label && (
          <span className="text-muted-foreground leading-none mt-0.5" style={{ fontSize: size * 0.14 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
