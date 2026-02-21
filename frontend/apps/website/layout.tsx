"use client"

import { BlurEffect, RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./app/navbars/Header";
import { useNavLists, usePage } from "@repo/shared-state";

export default function WebLayout({ children, }: Readonly<{
  children: React.ReactNode;
}>) {
  const { navigateTo } = usePage();
  const { footerNavList } = useNavLists();

  return (
    <RootUIContainer>
      <BlurEffect />
      <Header />
      {children}
      <Footer navList={footerNavList} navigateTo={navigateTo} />
    </RootUIContainer>
  )
}