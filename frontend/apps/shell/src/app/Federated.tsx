import { SplashUI } from '@funstakes/shared-ui';
import dynamic from 'next/dynamic';
import React, { Suspense, useMemo } from 'react';
//import { IModule } from '@funstakes/types';


const loaderMap = {
    feed: () => import('@apps/feed/src/exported'),
    website: () => import('@apps/website/src/exported'),
    auth: () => import('@apps/auth/src/exported'),
    offline: () => import('@apps/feed/src/exported'),
};

type AppNames = keyof typeof loaderMap;

interface Props {
    appName: AppNames;
    moduleName: string;
    props?: any;
}

export function FederatedComponent({ appName, moduleName, props = {} }: Props) {

    const RemoteNode = useMemo(() => {
        return dynamic(
            () => loaderMap[appName]().then((mod) => {
                const Component = (mod as any)[moduleName];
                if (!Component) {
                    // Help yourself out with a clear error if names don't match
                    return () => <div>Module {moduleName} not found in {appName}</div>;
                }
                return Component;
            }),
            {
                loading: () => <SplashUI />,
                ssr: true
            }
        );
    }, [appName, moduleName]); // Only recalculate if these change

    return (
        <Suspense fallback={<SplashUI />}>
            <RemoteNode {...props} />
        </Suspense>
    );
}