"use client";

export type GenericObject<T> = {
  [key: string]: T | GenericObject<T>;
};

export interface ListItemType {
  item: React.ReactNode | string;
  action?: () => void | null;
}

export type Feedback = {
  message: string | null;
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null;
  progressBar: {
    seconds: number;
    width: number;
  };
};
