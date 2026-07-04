import { colours, spacing } from "../../theme";

export default function Divider({
  margin = spacing.lg,
  colour = colours.border,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 1,
        background: colour,
        margin: `${margin}px 0`,
      }}
    />
  );
}
