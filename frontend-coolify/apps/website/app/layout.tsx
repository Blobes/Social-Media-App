import React from "react";
import { BaseLayout, GlobalUIManager, LanguageProvider } from "@repo/features";
import { Wrapper } from "./Wrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <GlobalUIManager showOfflineUI={false} showNetworkErrorUI={false}>
        <Wrapper>{children}</Wrapper>
      </GlobalUIManager>
    </BaseLayout>
  );
}
