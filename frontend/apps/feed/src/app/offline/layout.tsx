"use client"

import { OfflineWrapper } from "./OfflineWrapper";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OfflineWrapper>{children}</OfflineWrapper>
}