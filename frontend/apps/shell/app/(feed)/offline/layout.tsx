"use client"

import { ClientOnly } from "@repo/shared-state";
import { Wrapper } from "./Wrapper";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientOnly><Wrapper>{children}</Wrapper></ClientOnly>
}