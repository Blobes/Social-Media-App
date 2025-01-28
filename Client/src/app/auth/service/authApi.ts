"use client";

import { User } from "@/data/models";
import { userData } from "@/data/userData";

export const login = (input: string): User | null => {
  const user = userData.find(
    (user) => user.id === input || user.email === input
  );
  return user || null;
};
