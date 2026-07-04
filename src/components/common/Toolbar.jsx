import {
  colours,
  spacing,
  radius,
} from "../../theme";

export default function Toolbar({
  left,
  right,
  style = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,

        background: colours.surfaceAlt,
        border: `1px solid ${colours.border}`,
        borderRadius: radius.card,

        flexWrap: "wrap",

        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
          flex: 1,
        }}
      >
        {left}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {right}
      </div>
    </div>
  );
}