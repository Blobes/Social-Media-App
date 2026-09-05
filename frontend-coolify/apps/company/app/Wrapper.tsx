"use client";

import React from "react";
import { BlurEffect, RootUIContainer, Footer } from "@repo/shared-ui";
import { Header } from "./navbars/Header";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import { LISTS } from "@repo/core";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { translateTxtString } = useStaticTranslation();
  const { FOOTER_NAV_LIST } = LISTS(translateTxtString);

  return (
    <RootUIContainer>
      <BlurEffect />
      <Header />
      {children}
      <Footer navList={FOOTER_NAV_LIST} />
    </RootUIContainer>
  );
};
