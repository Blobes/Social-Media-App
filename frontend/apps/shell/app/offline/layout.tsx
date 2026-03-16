import { ClientOnly, BaseLayout } from "@repo/features";
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