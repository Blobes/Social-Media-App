import "@mui/material/styles";
import { GenericObject } from "../types";

type ExtendedGenericObject<T> = GenericObject<T> & {
  trans: GenericObject<T>;
};

declare module "@mui/material/styles" {
  interface Palette {
    gray: ExtendedGenericObject<string>;
  }
  interface PaletteOptions {
    gray?: ExtendedGenericObject<string>;
  }
  interface Theme {
    fixedColors: GenericObject<string>;
    radius: GenericObject<string>;
    boxSpacing: (
      val1: number,
      val2?: number,
      val3?: number,
      val4?: number
    ) => string;
    gap: (value: number) => string;
  }
  interface ThemeOptions {
    fixedColors?: GenericObject<string>;
    radius?: GenericObject<string>;
    boxSpacing?: (
      val1: number,
      val2?: number,
      val3?: number,
      val4?: number
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
