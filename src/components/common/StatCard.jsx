import {
  colours,
  radius,
  shadows,
  spacing,
  typography,
} from "../../theme";

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  onClick,
}) {
  const clickable =
    typeof onClick === "function";

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        background: colours.surface,
        border: `1px solid ${colours.border}`,
        borderRadius: radius.card,
        boxShadow: shadows.card,
        padding: spacing.lg,

        cursor: clickable
          ? "pointer"
          : "default",

        transition:
          "transform .15s ease",

        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!clickable) return;

        e.currentTarget.style.transform =
          "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      <div
        style={{
          fontSize: 34,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: spacing.md,
          ...typography.heading,
          fontSize: 30,
          color: colours.primary,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: spacing.sm,
          ...typography.label,
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: spacing.xs,
            ...typography.small,
            color: colours.textSecondary,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}