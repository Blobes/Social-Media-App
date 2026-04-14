import React from "react";
import { Viewport, Metadata } from "next";
import { BaseLayout, DefaultWrapper, GlobalUIManager } from "@repo/features";
import { Prefetcher } from "@repo/shared-ui";
import { baseMetadata, sharedViewport } from "@repo/helpers";

export const viewport: Viewport = {
  ...sharedViewport,
};

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Funstakes | Feed",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <Prefetcher route="/offline" />
      <GlobalUIManager>
        <DefaultWrapper>{children}</DefaultWrapper>
      </GlobalUIManager>
    </BaseLayout>
  );
}
