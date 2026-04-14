import React from "react";
import { Metadata } from "next";
import { baseMetadata } from "@repo/helpers";
import { BaseLayout, DefaultWrapper, GlobalUIManager } from "@repo/features";

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Gist",
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
