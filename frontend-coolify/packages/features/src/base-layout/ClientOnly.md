"use client";

import React, { useEffect, useState } from "react";
import { SplashUI } from "@repo/shared-ui";
//import dynamic from "next/dynamic";
import { UIManagerProps, GlobalUIManager } from "./GlobalUIManager";

// const UIManager = dynamic(
//   () => import("./UIManager").then((mod) => mod.UIManager),
//   {
//     ssr: false,
//     loading: () => <SplashUI />,
//   },
// );

export const ClientOnly = ({
  children,
  showOfflineUI,
  showNetworkErrorUI,
}: UIManagerProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If we aren't on the client yet, show the splash
  if (!isMounted) return <SplashUI />;

  return (
    <GlobalUIManager
      showOfflineUI={showOfflineUI}
      showNetworkErrorUI={showNetworkErrorUI}>
      {children}
    </GlobalUIManager>
  );
};

// import React, { useEffect, useState } from "react";
// import { SplashUI } from "@repo/shared-ui";
// import { UIManager } from "./UIManager"; // Import normally, no dynamic()

// export const ClientOnly = ({ children, ...props }: any) => {
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   // If we aren't on the client yet, show the splash
//   if (!isMounted) return <SplashUI />;

//   return <UIManager {...props}>{children}</UIManager>;
// };
