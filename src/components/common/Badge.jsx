import { colours, spacing, radius, typography } from "../../theme";

const variants = {
  primary: {
    background: colours.primary,
    color: "#FFFFFF",
  },

  success: {
    background: colours.success,
    color: "#FFFFFF",
  },

  warning: {
    background: colours.warning,
    color: "#FFFFFF",
  },

  danger: {
    background: colours.danger,
    color: "#FFFFFF",
  },

  info: {
    background: colours.info,
    color: "#FFFFFF",
  },

  neutral: {
    background: colours.surfaceAlt,
    color: colours.text,
    border: `1px solid ${colours.border}`,
  },
};

export default function Badge({
  children,
  variant = "neutral",
  style = {},
}) {
  const badge = variants[variant] || variants.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        minWidth: 70,

        padding: `${spacing.xs}px ${spacing.md}px`,

        borderRadius: radius.pill,

        background: badge.background,

        color: badge.color,

        border: badge.border || "none",

        ...typography.caption,

        whiteSpace: "nowrap",

        ...style,
      }}
    >
      {children}
    </span>
  );
}