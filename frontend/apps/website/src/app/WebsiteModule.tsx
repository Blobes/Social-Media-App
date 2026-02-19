"use client"

import { useGlobalContext } from '@funstakes/shared-state';
import { useEffect } from 'react';
import { About } from './about/About';
import { Pricing } from './pricing/Pricing';
import { Support } from './support/Support';
import { BlurEffect, Footer, RootUIContainer } from '@funstakes/shared-ui';
import { Header } from './navbars/Header';
import { IWebsiteModule } from '@funstakes/types';


export const WebsiteModule = ({ view, children }: IWebsiteModule) => {

    const { setDefaultWrapper } = useGlobalContext();

    useEffect(() => {
        setDefaultWrapper(false);
        return () => setDefaultWrapper(true);
    }, []);

    return (
        <RootUIContainer>
            <BlurEffect />
            <Header />
            {view === 'about' && <About />}
            {view === 'pricing' && <Pricing />}
            {view === 'support' && <Support />}
            <Footer />
        </RootUIContainer>
    );
}