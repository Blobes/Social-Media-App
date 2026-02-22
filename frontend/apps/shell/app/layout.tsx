import { Metadata } from "next";
import { ClientOnly, SharedProviders } from "@repo/shared-state";
import { BaseLayout, Prefetcher } from "@repo/shared-ui";
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
    <BaseLayout Providers={SharedProviders} >
      <Prefetcher route="/offline" />
      <ClientOnly>{children}</ClientOnly>
    </BaseLayout>
  );
}