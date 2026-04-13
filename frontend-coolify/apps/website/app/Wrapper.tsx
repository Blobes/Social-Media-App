"use client";

import React from "react";
import { BlurEffect, RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./navbars/Header";
import { usePage } from "@repo/shared-state";
import { LISTS } from "@repo/core";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { navigateTo } = usePage();
  const { FOOTER_NAV_LIST } = LISTS();

  return (
    <RootUIContainer>
      <BlurEffect />
      <Header />
      {children}
      <Footer navList={FOOTER_NAV_LIST} navigateTo={navigateTo} />
    </RootUIContainer>
  );
};
