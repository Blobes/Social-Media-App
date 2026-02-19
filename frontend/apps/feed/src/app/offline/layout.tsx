"use client"

import { OfflineModule } from "./OfflineModule";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>
}