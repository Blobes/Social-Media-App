"use client";

import React from "react";
import { BlurEffect, RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./navbars/Header";
import { useNavLists, usePage } from "@repo/shared-state";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { navigateTo } = usePage();
  const { footerNavList } = useNavLists();

  return (
    <RootUIContainer>
      <BlurEffect />
      <Header />
      {children}
      <Footer navList={footerNavList} navigateTo={navigateTo} />
    </RootUIContainer>
  );
};
