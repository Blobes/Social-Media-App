"use client";

import { IUser } from "@/types";
import { userData } from "@/data/userData";

export const login = (input: string): IUser | null => {
  const user = userData.find(
    (user) => user.id === input || user.email === input
  );
  return user || null;
};
