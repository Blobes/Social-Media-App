"use server";

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@repo/helpers";
import { GlobalThemeProvider } from "@repo/core";
import { SocketProvider } from "./SocketProvider";

export async function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                (function() {
                  try {
                    const mode = localStorage.getItem('mui-mode') || 'dark';
                    const bg = mode === 'dark' ? '#121421' : '#ffffff'; 
                    document.documentElement.style.setProperty('--app-bg', bg);
                  } catch (e) {}
                })();
              `,
          }}
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701,900,901&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <GlobalThemeProvider>{children}</GlobalThemeProvider>
          </SocketProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <noscript>You need to enable JavaScript to run this app!</noscript>
      </body>
    </html>
  );
}
