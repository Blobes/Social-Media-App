import React from "react";
import { BaseLayout, GlobalUIManager } from "@repo/features";
import { Wrapper } from "./Wrapper";

export default function OfflineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <GlobalUIManager includesOfflineUI={false} includesNetworkErrorUI={false}>
        <Wrapper>{children}</Wrapper>
      </GlobalUIManager>
    </BaseLayout>
  );
}
