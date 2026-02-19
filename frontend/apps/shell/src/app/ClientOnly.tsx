'use client';

import { SplashUI, Prefetcher } from '@funstakes/shared-ui';
import dynamic from 'next/dynamic';
import React from 'react';
import "@apps/auth/src/exported";


const UIManager = dynamic(
    () => import('./UIManager').then((mod) => mod.UIManager),
    {
        ssr: false,
        loading: () => <SplashUI />, // Optional: Render nothing while loading
    }
);

export default function ClientOnly({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Prefetcher route="/offline" />
            <UIManager>{children}</UIManager>
        </>
    )
}