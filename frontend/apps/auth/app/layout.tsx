import { RootUIContainer } from "@repo/shared-ui";
import { Metadata, Viewport } from "next";
import { BaseLayout, ClientOnly } from "@repo/base-layout";
import { baseMetadata, sharedViewport } from "@repo/helpers";

export const viewport: Viewport = {
  ...sharedViewport
}
export const metadata: Metadata = {
  ...baseMetadata,
  title: "Authentication | Funstakes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout >
      <ClientOnly>
        <RootUIContainer shouldScroll={true}>
          {children}
        </RootUIContainer>
      </ClientOnly>
    </BaseLayout>
  );
}
