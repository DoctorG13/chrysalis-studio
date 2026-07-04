import {
  colours,
  spacing,
  typography,
} from "../../theme";

export default function SectionHeader({
  title,
  subtitle,
  icon,
  actions,
  style = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.lg,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        {icon && (
          <span
            style={{
              fontSize: 24,
            }}
          >
            {icon}
          </span>
        )}

        <div>
          <div
            style={{
              ...typography.section,
              color: colours.text,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                ...typography.small,
                color: colours.textSecondary,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}