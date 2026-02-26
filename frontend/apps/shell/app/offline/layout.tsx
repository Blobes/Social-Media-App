import { ClientOnly, SharedProviders } from "@repo/shared-state";
import { Wrapper } from "./Wrapper";
import { BaseLayout } from "@repo/shared-ui";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BaseLayout Providers={SharedProviders}>
      <ClientOnly>
        <Wrapper>
          {children}
        </Wrapper>
      </ClientOnly>
    </BaseLayout>
  )
}