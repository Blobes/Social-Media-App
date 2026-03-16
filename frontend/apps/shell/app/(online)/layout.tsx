import { Metadata } from "next";
import { BaseLayout, ClientOnly, DefaultWrapper } from "@repo/base-layout";
import { Prefetcher } from "@repo/shared-ui";
import { baseMetadata, sharedViewport } from "@repo/helpers";
import { Viewport } from "next";

export const viewport: Viewport = {
  ...sharedViewport
}

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Feed | Funstakes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout  >
      <Prefetcher route="/offline" />
      <ClientOnly><DefaultWrapper>{children}</DefaultWrapper></ClientOnly>
    </BaseLayout>
  );
}