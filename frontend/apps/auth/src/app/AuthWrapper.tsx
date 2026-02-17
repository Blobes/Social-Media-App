
import { Signup } from './signup/Signup';
import { Login } from './login/Login';
import { useGlobalContext } from 'libs/shared-state/GlobalContext';
import { useEffect } from 'react';
import { RootUIContainer } from '@shared-ui';

interface WrapperProps {
    view: "login" | "signup";
    children?: React.ReactNode;
}

export default function AuthWrapper({ view, children }: WrapperProps) {

    const { setHideDefaultHub } = useGlobalContext();

    useEffect(() => {
        setHideDefaultHub(true)
    }, []);

    return (
        <RootUIContainer>
            {view === 'login' && <Login />}
            {view === 'signup' && <Signup />}
        </RootUIContainer>
    );
}