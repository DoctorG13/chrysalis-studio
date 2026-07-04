import {
  colours,
  spacing,
  typography,
} from "../../theme";

export default function PanelHeader({
  title,
  subtitle,
  icon,
  onClose,
  actions,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.panelPadding,
        background: colours.primary,
        color: "#FFFFFF",
        borderBottom: `1px solid ${colours.border}`,
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
              fontSize: 28,
            }}
          >
            {icon}
          </span>
        )}

        <div>
          <div
            style={{
              ...typography.section,
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                ...typography.small,
                color: "rgba(255,255,255,0.75)",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        {actions}

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#FFFFFF",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              padding: spacing.xs,
              lineHeight: 1,
            }}
            title="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}