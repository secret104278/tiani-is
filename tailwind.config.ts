import daisyui, { type Config as DaisyUIConfig } from "daisyui";
import { type Config } from "tailwindcss";

type DaisyuiThemeExtend = {
  borderRadius: {
    badge: string;
    btn: string;
    box: string;
  };
  colors: {
    "base-100": string;
    "base-200": string;
    "base-300": string;
    "base-content": string;
    primary: string;
    "primary-content": string;
    secondary: string;
    "secondary-content": string;
    accent: string;
    "accent-content": string;
    neutral: string;
    "neutral-content": string;
    info: string;
    "info-content": string;
    success: string;
    "success-content": string;
    warning: string;
    "warning-content": string;
    error: string;
    "error-content": string;
  };
};
const daisyuiThemeExtend = daisyui.config!.theme!.extend as DaisyuiThemeExtend;

const shadcnThemeExtend = {
  borderRadius: {
    lg: daisyuiThemeExtend.borderRadius.badge,
    md: daisyuiThemeExtend.borderRadius.btn,
    sm: daisyuiThemeExtend.borderRadius.box,
  },
  colors: {
    background: daisyuiThemeExtend.colors["base-100"],
    foreground: daisyuiThemeExtend.colors["base-content"],
    card: {
      DEFAULT: daisyuiThemeExtend.colors["base-100"],
      foreground: daisyuiThemeExtend.colors["base-content"],
    },
    popover: {
      DEFAULT: daisyuiThemeExtend.colors["base-100"],
      foreground: daisyuiThemeExtend.colors["base-content"],
    },
    primary: {
      DEFAULT: daisyuiThemeExtend.colors.primary,
      foreground: daisyuiThemeExtend.colors["primary-content"],
    },
    secondary: {
      DEFAULT: daisyuiThemeExtend.colors.secondary,
      foreground: daisyuiThemeExtend.colors["secondary-content"],
    },
    muted: {
      DEFAULT: daisyuiThemeExtend.colors["base-300"],
      foreground: daisyuiThemeExtend.colors["base-content"],
    },
    accent: {
      DEFAULT: daisyuiThemeExtend.colors.accent,
      foreground: daisyuiThemeExtend.colors["accent-content"],
    },
    destructive: {
      DEFAULT: daisyuiThemeExtend.colors.error,
      foreground: daisyuiThemeExtend.colors["error-content"],
    },
    border: daisyuiThemeExtend.colors["base-300"],
    input: daisyuiThemeExtend.colors["base-300"],
    ring: daisyuiThemeExtend.colors.primary,
    chart: {
      "1": "hsl(var(--chart-1))",
      "2": "hsl(var(--chart-2))",
      "3": "hsl(var(--chart-3))",
      "4": "hsl(var(--chart-4))",
      "5": "hsl(var(--chart-5))",
    },
  },
};

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      ...shadcnThemeExtend,
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    require("tailwindcss-animate"),
  ],
  daisyui: {
    themes: ["autumn", "garden", "fantasy", "cupcake"],
  } satisfies DaisyUIConfig,
} satisfies Config;
