"use client";

import React from "react";
import { SplashUI } from "@repo/shared-ui";
import dynamic from "next/dynamic";
import { UIManagerProps } from "./UIManager";

const UIManager = dynamic(
  () => import("./UIManager").then((mod) => mod.UIManager),
  {
    ssr: false,
    loading: () => <SplashUI />,
  },
);

export const ClientOnly = ({
  children,
  showOfflineUI,
  showNetworkErrorUI,
}: UIManagerProps) => {
  return (
    <UIManager
      showOfflineUI={showOfflineUI}
      showNetworkErrorUI={showNetworkErrorUI}>
      {children}
    </UIManager>
  );
};
