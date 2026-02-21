'use client';

import { SplashUI } from '@repo/shared-ui';
import dynamic from 'next/dynamic';

const UIManager = dynamic(
    () => import('./UIManager').then((mod) => mod.UIManager),
    {
        ssr: false,
        loading: () => <SplashUI />, // Optional: Render nothing while loading
    }
);

interface ClientProps {
    children: React.ReactNode;
    hideHeader?: boolean;
    hideWrapper?: boolean;
}

export const ClientOnly = ({ children, hideHeader, hideWrapper = false }: ClientProps) => {
    return <UIManager hideHeader={hideHeader}
        hideWrapper={hideWrapper}>{children}</UIManager>
}