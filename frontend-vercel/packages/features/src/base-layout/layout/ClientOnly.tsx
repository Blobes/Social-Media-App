'use client';

import { SplashUI } from '@repo/shared-ui';
import dynamic from 'next/dynamic';

const UIManager = dynamic(() => import('../UIManager').then((mod) => mod.UIManager),
    {
        ssr: false,
        loading: () => <SplashUI />
    }
);

export const ClientOnly = ({ children }: { children: React.ReactNode }) => {
    return <UIManager>{children}</UIManager>
}