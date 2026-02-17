"use client"

import { useGlobalContext } from '@shared-state';
import { useEffect } from 'react';
import { About } from './about/About';
import Pricing from './pricing/Pricing';
import Support from './support/Support';
import { BlurEffect, Footer, RootUIContainer } from '@shared-ui';
import { Header } from 'apps/website/navbars/Header';

interface WrapperProps {
    view: "about" | "pricing" | "support";
    children?: React.ReactNode;
}

export default function WebsiteWrapper({ view, children }: WrapperProps) {

    const { setHideDefaultHub } = useGlobalContext();

    useEffect(() => {
        setHideDefaultHub(true)
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