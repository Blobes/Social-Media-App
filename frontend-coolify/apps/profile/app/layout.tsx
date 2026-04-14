import React from "react";
import { Metadata } from "next";
import { BaseLayout, DefaultWrapper, GlobalUIManager } from "@repo/features";
import { baseMetadata } from "@repo/helpers";

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Profile",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <GlobalUIManager>
        <DefaultWrapper>{children}</DefaultWrapper>
      </GlobalUIManager>
    </BaseLayout>
  );
}
