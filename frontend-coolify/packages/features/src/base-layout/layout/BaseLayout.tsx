"use server";

import React from "react";
import { SharedProviders } from "../Providers";

export async function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@200,300,400,500,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#010516!important" }}>
        <SharedProviders>{children}</SharedProviders>
        <noscript>You need to enable JavaScript to run this app!</noscript>
      </body>
    </html>
  );
}
