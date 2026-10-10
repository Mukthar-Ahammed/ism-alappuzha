import React from "react";
import { cn } from "@/lib/utils/cn";
import { COLORS } from "@/lib/constants/colors";

export interface GirihPatternProps {
  size?: number;
  color?: string;
  opacity?: number;
  variant?: "8-fold" | "10-fold";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * GirihPattern: Reusable SVG Islamic geometric tessellation pattern.
 * Uses COLORS.accent as default stroke color for consistent site-wide detailing.
 */
export const GirihPattern: React.FC<GirihPatternProps> = ({
  size = 120,
  color = COLORS.secondary,
  opacity = 0.15,
  variant = "8-fold",
  className,
  style,
}) => {
  const patternId = React.useId();

  return (
    <svg
      className={cn("pointer-events-none aria-hidden:true w-full h-full", className)}
      aria-hidden="true"
      style={{ opacity, ...style }}
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          {variant === "8-fold" ? (
            <g stroke={color} strokeWidth="1" fill="none" opacity="0.8">
              <path
                d={`M ${size * 0.5} 0 L ${size * 0.65} ${size * 0.35} L ${size} ${size * 0.5} L ${size * 0.65} ${size * 0.65} L ${size * 0.5} ${size} L ${size * 0.35} ${size * 0.65} L 0 ${size * 0.5} L ${size * 0.35} ${size * 0.35} Z`}
              />
              <path
                d={`M 0 0 L ${size * 0.35} ${size * 0.35} L ${size * 0.5} 0 L ${size * 0.65} ${size * 0.35} L ${size} 0 L ${size * 0.65} ${size * 0.65} L ${size} ${size} L ${size * 0.35} ${size * 0.65} L 0 ${size} L ${size * 0.35} ${size * 0.35} Z`}
              />
              <polygon
                points={`${size * 0.5},${size * 0.2} ${size * 0.6},${size * 0.4} ${size * 0.8},${size * 0.5} ${size * 0.6},${size * 0.6} ${size * 0.5},${size * 0.8} ${size * 0.4},${size * 0.6} ${size * 0.2},${size * 0.5} ${size * 0.4},${size * 0.4}`}
              />
              <circle
                cx={size * 0.5}
                cy={size * 0.5}
                r={size * 0.15}
                stroke={color}
                strokeDasharray="2 2"
              />
            </g>
          ) : (
            <g stroke={color} strokeWidth="1" fill="none" opacity="0.8">
              <polygon
                points={`${size * 0.5},${size * 0.05} ${size * 0.62},${size * 0.35} ${size * 0.95},${size * 0.35} ${size * 0.68},${size * 0.55} ${size * 0.79},${size * 0.88} ${size * 0.5},${size * 0.67} ${size * 0.21},${size * 0.88} ${size * 0.32},${size * 0.55} ${size * 0.05},${size * 0.35} ${size * 0.38},${size * 0.35}`}
              />
              <rect
                x={size * 0.1}
                y={size * 0.1}
                width={size * 0.8}
                height={size * 0.8}
                stroke={color}
                strokeWidth="0.5"
              />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};
