"use client"

import { ClientOnly } from "@repo/shared-state";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientOnly hideWrapper={true}>{children}</ClientOnly>
}