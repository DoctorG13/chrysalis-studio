import {
  colours,
  spacing,
  radius,
  typography,
} from "../../theme";

export default function EmptyState({
  icon = "📄",
  title = "Nothing here yet",
  message = "There are currently no records to display.",
  action = null,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: spacing.xxxl,
        background: colours.surfaceAlt,
        border: `1px dashed ${colours.border}`,
        borderRadius: radius.card,
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: spacing.lg,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          ...typography.section,
          color: colours.text,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </div>

      <div
        style={{
          ...typography.body,
          color: colours.textSecondary,
          maxWidth: 420,
          margin: "0 auto",
          marginBottom: action ? spacing.lg : 0,
        }}
      >
        {message}
      </div>

      {action && action}
    </div>
  );
}