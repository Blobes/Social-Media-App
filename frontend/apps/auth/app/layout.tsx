import { BaseLayout, RootUIContainer } from "@repo/shared-ui";
import { Metadata, Viewport } from "next";
import { ClientOnly, SharedProviders } from "@repo/shared-state";
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
    <BaseLayout Providers={SharedProviders} >
      <ClientOnly hideWrapper={true}>
        <RootUIContainer>{children}</RootUIContainer>
      </ClientOnly>
    </BaseLayout>
  );
}
