import React from "react";
import { Metadata } from "next";
import { DefaultWrapper } from "@repo/features";
import { baseMetadata } from "@repo/helpers";

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Stake",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DefaultWrapper>{children}</DefaultWrapper>;
}
