"use server";

//import { InitColorSchemeScript } from "@mui/material";

import { cookies } from "next/headers";

interface BaseLayoutProps {
    children: React.ReactNode;
    Providers: React.ComponentType<{
        children: React.ReactNode;
        // themeMode: "light" | "dark"
    }>;
}

export async function BaseLayout({ children, Providers }: BaseLayoutProps) {
    // const cookieStore = await cookies();
    // const themeMode = (cookieStore.get("app-theme-mode")?.value as "light" | "dark");

    return (
        <html lang="en"
        // data-mui-color-scheme={themeMode}
        // style={{ colorScheme: themeMode }}
        >
            <head>

                <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@200,300,400,500,700&display=swap"
                    rel="stylesheet" />
                <link rel="preconnect"
                    href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
                    rel="stylesheet" />
            </head>
            <body style={{ backgroundColor: '#010516!important' }}>

                <Providers>{children}</Providers>
                <noscript>You need to enable JavaScript to run this app!</noscript>
            </body>
        </html>
    );
}