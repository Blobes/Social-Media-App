import { BlurEffect, RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./navbars/Header";
import { useNavLists, usePage } from "@repo/shared-state";
import { BaseLayout, ClientOnly } from "@repo/features";

export default function RootLayout({ children, }: Readonly<{
  children: React.ReactNode;
}>) {
  const { navigateTo } = usePage();
  const { footerNavList } = useNavLists();

  return (
    <BaseLayout >
      <ClientOnly>
        <RootUIContainer>
          <BlurEffect />
          <Header />
          {children}
          <Footer navList={footerNavList} navigateTo={navigateTo} />
        </RootUIContainer>
      </ClientOnly>
    </BaseLayout>
  )
}