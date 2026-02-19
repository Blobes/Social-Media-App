
import { Signup } from './signup/Signup';
import { Login } from './login/Login';
import { useGlobalContext } from '@funstakes/shared-state';
import { useEffect } from 'react';
import { RootUIContainer } from '@funstakes/shared-ui';
import { IAuthModule } from '@funstakes/types';

export const AuthModule = ({ view, children }: IAuthModule) => {
    const { setDefaultWrapper } = useGlobalContext();

    useEffect(() => {
        setDefaultWrapper(false);
        return () => setDefaultWrapper(true);
    }, []);

    return (
        <RootUIContainer>
            {view === 'login' && <Login />}
            {view === 'signup' && <Signup />}
        </RootUIContainer>
    );
}