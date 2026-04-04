import { Metadata } from "next";
import { baseMetadata } from "@repo/helpers";
import { BaseLayout, ClientOnly, DefaultWrapper } from "@repo/features";


export const metadata: Metadata = {
  ...baseMetadata,
  title: "Gist",
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
