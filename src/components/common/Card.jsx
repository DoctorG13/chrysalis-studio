import {
  colours,
  spacing,
  radius,
  shadows,
  typography,
} from "../../theme";

export default function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
  style = {},
  bodyStyle = {},
}) {
  return (
    <div
      style={{
        background: colours.surface,
        border: `1px solid ${colours.border}`,
        borderRadius: radius.card,
        boxShadow: shadows.card,
        overflow: "hidden",
        marginBottom: spacing.lg,
        ...style,
      }}
    >
      {(title || subtitle || icon || actions) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: spacing.cardPadding,
            borderBottom: `1px solid ${colours.borderLight}`,
            background: colours.surfaceAlt,
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
                  fontSize: 22,
                }}
              >
                {icon}
              </span>
            )}

            <div>
              {title && (
                <div
                  style={{
                    ...typography.section,
                    color: colours.text,
                  }}
                >
                  {title}
                </div>
              )}

              {subtitle && (
                <div
                  style={{
                    ...typography.small,
                    color: colours.textSecondary,
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
                gap: spacing.sm,
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: spacing.cardPadding,
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}