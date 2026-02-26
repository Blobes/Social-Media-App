import { BaseLayout } from "@repo/shared-ui";
import { Metadata } from "next";
import { ClientOnly, DefaultWrapper, SharedProviders } from "@repo/shared-state";
import { baseMetadata } from "@repo/helpers";


export const metadata: Metadata = {
  ...baseMetadata,
  title: "Profile",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout Providers={SharedProviders} >
      <ClientOnly><DefaultWrapper>{children}</DefaultWrapper></ClientOnly>
    </BaseLayout>
  );
}
