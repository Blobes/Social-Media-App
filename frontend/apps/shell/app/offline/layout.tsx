import { ClientOnly, BaseLayout } from "@repo/base-layout";
import { Wrapper } from "./Wrapper";

export default function OfflineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout>
      <ClientOnly>
        <Wrapper>
          {children}
        </Wrapper>
      </ClientOnly>
    </BaseLayout>
  )
}