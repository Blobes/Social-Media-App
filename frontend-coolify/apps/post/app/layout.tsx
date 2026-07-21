import React from "react";
import { Metadata } from "next";
import { BaseLayout, GlobalUIManager } from "@repo/features";
import { baseMetadata } from "@repo/helpers";

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Post",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <GlobalUIManager>{children}</GlobalUIManager>
    </BaseLayout>
  );
}
