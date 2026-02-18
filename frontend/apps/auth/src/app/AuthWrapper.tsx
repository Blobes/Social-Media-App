
import { Signup } from './signup/Signup';
import { Login } from './login/Login';
import { useGlobalContext } from '@funstakes/shared-state';
import { useEffect } from 'react';
import { RootUIContainer } from '@funstakes/shared-ui';

interface WrapperProps {
    view: "login" | "signup";
    children?: React.ReactNode;
}

export const AuthWrapper = ({ view, children }: WrapperProps) => {

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