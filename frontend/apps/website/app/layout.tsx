import { BaseLayout, RootUIContainer } from "@repo/shared-ui";
import { Metadata } from "next";
import { ClientOnly, SharedProviders } from "@repo/shared-state";
import { baseMetadata } from "@repo/helpers";


export const metadata: Metadata = {
  ...baseMetadata,
  title: "Company",
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
