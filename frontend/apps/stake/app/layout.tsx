import { Metadata } from "next";
import { BaseLayout, ClientOnly, DefaultWrapper } from "@repo/base-layout";
import { baseMetadata } from "@repo/helpers";


export const metadata: Metadata = {
  ...baseMetadata,
  title: "Stake",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout >
      <ClientOnly><DefaultWrapper>{children}</DefaultWrapper></ClientOnly>
    </BaseLayout>
  );
}
