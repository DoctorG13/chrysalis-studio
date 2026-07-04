// 🦋 Chrysalis Studio
// Shadow System

import colours from "./colours";

const shadows = {
  none: "none",

  xs: `0 1px 2px ${colours.shadow}`,

  sm: `0 2px 4px ${colours.shadow}`,

  md: `0 4px 8px ${colours.shadow}`,

  lg: `0 8px 16px ${colours.shadow}`,

  xl: `0 12px 24px ${colours.shadow}`,

  card: `0 2px 6px ${colours.shadow}`,

  panel: `0 8px 24px ${colours.shadow}`,

  floating: `0 12px 30px rgba(0,0,0,0.15)`,

  inset: "inset 0 1px 2px rgba(0,0,0,0.08)",
};

export default shadows;