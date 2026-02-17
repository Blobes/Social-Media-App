import "@mui/material/styles";

declare module "@mui/material/styles" {
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
        // Explicitly define overlay as a function
        overlay: (trans?: number) => string;
      };
    };
  }
  interface PaletteOptions {
    gray?: Partial<Palette["gray"]>;
  }

  interface Theme {
    fixedColors: Record<string, string>;
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
    fixedColors?: Record<string, string>;
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
