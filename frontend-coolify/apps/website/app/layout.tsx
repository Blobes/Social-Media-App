import React from "react";
import { BaseLayout, ClientOnly } from "@repo/features";
import { Wrapper } from "./Wrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <ClientOnly showOfflineUI={false} showNetworkErrorUI={false}>
        <Wrapper>{children}</Wrapper>
      </ClientOnly>
    </BaseLayout>
  );
}
