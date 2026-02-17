"use client"

import { DefaultWrapper } from "apps/shell/src/app/default/DefaultWrapper";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DefaultWrapper>{children}</DefaultWrapper>
}