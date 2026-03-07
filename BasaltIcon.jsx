/**
 * BasaltIcon — Final production component
 * B4 V10 — Concentric hex rings, ember core
 *
 * Usage:
 *   <BasaltIcon size={32} />
 *   <BasaltIcon size={48} variant="light" />
 *   <BasaltIcon size={48} variant="ember" />   ← for colored backgrounds
 *   <BasaltIcon size={48} tile={false} />       ← icon only, no rounded-square bg
 */

export function BasaltIcon({ size = 32, variant = "dark", tile = true }) {
  const s   = size;
  const cx  = s / 2;
  const cy  = s / 2;
  const rx  = s * 0.22;

  // Ring radii — V10 proportions
  const r1 = s * 0.385;  // outer
  const r2 = s * 0.255;  // mid
  const r3 = s * 0.135;  // ember core

  function hexPoints(r) {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
  }

  const themes = {
    dark: {
      bg:    "#0C0A09",
      ring1: "#3D3A37",
      ring2: "#1E1B19",
      core:  "#F97316",
    },
    light: {
      bg:    "#FFFFFF",
      ring1: "#A8A29E",
      ring2: "#E7E5E4",
      core:  "#F97316",
    },
    ember: {
      bg:    "#F97316",
      ring1: "rgba(0,0,0,0.20)",
      ring2: "rgba(0,0,0,0.12)",
      core:  "#0C0A09",
    },
  };

  const t = themes[variant] ?? themes.dark;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Basalt"
      role="img"
    >
      {tile && <rect width={s} height={s} rx={rx} fill={t.bg} />}
      <polygon points={hexPoints(r1)} fill={t.ring1} />
      <polygon points={hexPoints(r2)} fill={t.ring2} />
      <polygon points={hexPoints(r3)} fill={t.core}  />
    </svg>
  );
}

/**
 * BasaltLogo — Icon + wordmark lockup
 *
 * Usage:
 *   <BasaltLogo size={32} />
 *   <BasaltLogo size={48} variant="light" />
 */
export function BasaltLogo({ size = 32, variant = "dark" }) {
  const textColor = variant === "light" ? "#1C1917" : "#FAFAF9";
  const fontSize  = size * 0.42;
  const gap       = size * 0.28;

  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <BasaltIcon size={size} variant={variant} />
      <span style={{
        fontSize,
        fontWeight: 500,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: textColor,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        userSelect: "none",
      }}>
        basalt
      </span>
    </div>
  );
}
