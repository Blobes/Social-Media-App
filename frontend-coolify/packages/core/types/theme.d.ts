import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteColor {
    trans: string;
  }
  interface SimplePaletteColorOptions {
    trans?: string;
  }
  interface Palette {
    gray: {
      0: string;
      50: string;
      100: string;
      200: string;
      300: string;
      trans: {
        1: string;
        2: string;
        overlay: (opacity?: number, adaptive?: boolean) => string;
      };
    };
    error: {
      light: string;
      main: string;
      dark: string;
      trans: string;
    };
  }
  interface PaletteOptions {
    gray?: Partial<Palette["gray"]>;
    error?: Partial<Palette["error"]>;
  }

  interface Theme {
    fixedColors: Record<string, any>;
    radius: Record<string | number, string>;
    boxSpacing: (
      top: number,
      right?: number,
      bottom?: number,
      left?: number,
    ) => string;
    gap: (value: number) => string;
  }
  interface ThemeOptions {
    fixedColors?: Record<string, any>;
    radius?: Record<string | number, string>;
    boxSpacing?: (
      top: number,
      right?: number,
      bottom?: number,
      left?: number,
    ) => string;
    gap?: (value: number) => string;
  }
  interface TypographyVariants {
    body3: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body3: true;
  }
}
