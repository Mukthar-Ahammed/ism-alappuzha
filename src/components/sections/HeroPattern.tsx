import React from "react";

/** Tile size in px. */
const tile = 88;
const centre = tile / 2;

/** An eight-point star (khatam) outline: 16 points alternating between two radii. */
function starPath(cx: number, cy: number, outer: number): string {
  // Inner radius that makes the outline two overlapping squares' silhouette.
  const inner = (outer * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  const points = Array.from({ length: 16 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 8) * index - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  });

  return `M${points.join("L")}Z`;
}

const star = starPath(centre, centre, 30);
const innerStar = starPath(centre, centre, 14);
const diamond = (cx: number, cy: number, size: number) =>
  `M${cx} ${cy - size}L${cx + size} ${cy}L${cx} ${cy + size}L${cx - size} ${cy}Z`;
// Where four tiles meet, each tile draws a quarter of a diamond; together they make one.
const corners = [
  [0, 0],
  [tile, 0],
  [0, tile],
  [tile, tile],
].map(([x, y]) => diamond(x, y, 11));

/**
 * Islamic star pattern for the hero background: eight-point stars with a smaller star at
 * their heart and diamonds between them. Drawn in the theme gold, very faint, and masked
 * away from the headline so the text stays easy to read.
 */
export const HeroPattern: React.FC<{ className?: string; patternId?: string }> = ({
  className = "text-secondary opacity-[0.28] [mask-image:linear-gradient(to_bottom,transparent_8%,black_55%)] lg:[mask-image:linear-gradient(to_right,transparent_12%,rgb(0_0_0/0.35)_42%,black_75%)]",
  patternId = "hero-star-pattern",
}) => (
  <svg
    aria-hidden="true"
    className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
  >
    <defs>
      <pattern id={patternId} width={tile} height={tile} patternUnits="userSpaceOnUse">
        <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
          <path d={star} />
          <path d={innerStar} />
          {corners.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
  </svg>
);
