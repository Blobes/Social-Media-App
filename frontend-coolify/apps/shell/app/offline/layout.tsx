import React from "react";
import { ClientOnly, BaseLayout } from "@repo/features";
import { Wrapper } from "./Wrapper";

export default function OfflineLayout({
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
