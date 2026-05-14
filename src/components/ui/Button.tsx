import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"       // accent background, white text
  | "ghost"         // transparent, muted text — for close/icon actions
  | "outline"       // transparent + border — for Cancel-style actions
  | "danger"        // red border + red text — for destructive actions with a border
  | "danger-ghost"; // no border, goes red on hover — for destructive icon buttons

export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Renders as a square icon-only button with equal width/height and no text
   * padding.  sm → 28×28 px  |  md → 34×34 px
   */
  iconOnly?: boolean;
}

// ── Variant style map ─────────────────────────────────────────────────────────

type VariantEntry = {
  rest: React.CSSProperties;
  hover: React.CSSProperties;
  pressed: React.CSSProperties;
};

const VARIANTS: Record<ButtonVariant, VariantEntry> = {
  primary: {
    rest:    { background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600 },
    hover:   { background: "var(--accent-hover, rgba(79,82,220,1))", boxShadow: "0 4px 14px rgba(99,102,241,0.38)" },
    pressed: { background: "rgba(67,70,200,1)", boxShadow: "none" },
  },
  ghost: {
    rest:    { background: "transparent", color: "var(--text-sub)", border: "none", fontWeight: 500 },
    hover:   { background: "var(--bg-elevated)", boxShadow: "none" },
    pressed: { background: "var(--bg-chip)", boxShadow: "none" },
  },
  outline: {
    rest:    { background: "transparent", color: "var(--text-sub)", border: "1px solid var(--border-default)", fontWeight: 500 },
    hover:   { background: "var(--bg-elevated)", boxShadow: "none" },
    pressed: { background: "var(--bg-chip)", boxShadow: "none" },
  },
  danger: {
    rest:    { background: "transparent", color: "var(--priority-high)", border: "1px solid var(--priority-high)", fontWeight: 500 },
    hover:   { background: "rgba(239,68,68,0.1)", boxShadow: "0 2px 8px rgba(239,68,68,0.18)" },
    pressed: { background: "rgba(239,68,68,0.18)", boxShadow: "none" },
  },
  "danger-ghost": {
    rest:    { background: "transparent", color: "var(--text-sub)", border: "none", fontWeight: 500 },
    hover:   { background: "rgba(239,68,68,0.1)", color: "var(--priority-high)", boxShadow: "none" },
    pressed: { background: "rgba(239,68,68,0.18)", color: "var(--priority-high)", boxShadow: "none" },
  },
};

// ── Size map ──────────────────────────────────────────────────────────────────

const TEXT_SIZES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "5px 12px", borderRadius: 6, fontSize: 12, gap: 5 },
  md: { padding: "7px 16px", borderRadius: 8, fontSize: 13, gap: 6 },
};

const ICON_SIZES: Record<ButtonSize, React.CSSProperties> = {
  sm: { width: 28, height: 28, borderRadius: 6,  padding: 0 },
  md: { width: 34, height: 34, borderRadius: 10, padding: 0 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Button({
  variant = "ghost",
  size = "md",
  iconOnly = false,
  style,
  children,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const v   = VARIANTS[variant];
  const on  = hovered && !disabled;
  const dn  = pressed && !disabled;

  // Icon buttons get a punchy scale; text buttons get a subtle lift
  const scaleHover = iconOnly ? "scale(1.07)" : variant === "primary" ? "scale(1.03)" : "scale(1.02)";
  const scalePress = iconOnly ? "scale(0.92)" : variant === "primary" ? "scale(0.97)" : "scale(0.98)";

  return (
    <button
      disabled={disabled}
      onMouseEnter={(e) => { setHovered(true);  onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); onMouseLeave?.(e); }}
      onMouseDown={(e)  => { setPressed(true);  onMouseDown?.(e); }}
      onMouseUp={(e)    => { setPressed(false); onMouseUp?.(e); }}
      style={{
        // Layout
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "inherit",
        // State
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        // Transitions
        transition:
          "background 0.15s, transform 0.12s, box-shadow 0.15s, color 0.15s, opacity 0.15s",
        transform: dn ? scalePress : on ? scaleHover : "scale(1)",
        // Variant (rest → hover → pressed — each layer only overrides what it defines)
        ...v.rest,
        boxShadow: "none",
        ...(on ? v.hover   : {}),
        ...(dn ? v.pressed : {}),
        // Size
        ...(iconOnly ? ICON_SIZES[size] : TEXT_SIZES[size]),
        // Caller overrides (e.g. width: "100%", borderRadius: "50%", etc.)
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
