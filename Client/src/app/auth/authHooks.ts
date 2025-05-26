"use client";

import { useAppContext } from "@/app/AppContext";
import { useFeedback } from "@/shared/sharedHooks";
import { fetcher } from "@/shared/helpers/fetcher";
import { IUser } from "@/shared/types";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse {
  message: string;
  payload?: IUser;
  status: "SUCCESS" | "ERROR";
}

export const useAuth = () => {
  const { setUser, setLoginStatus, setIsLoading } = useAppContext();
  const { setFbMessage } = useFeedback();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);

    //Login Api call
    try {
      const response = await fetcher<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const { message, payload, status } = response;
      setUser(payload!);
      setLoginStatus((prev) => !prev);
      setIsLoading(false);
      setFbMessage({ timedMessage: message }, status);
      console.log(message);
    } catch (error: any) {
      console.error(error);
      setFbMessage(
        {
          timedMessage: error.message,
          fixedMessage: "You entered a wrong email or password",
        },
        error.status
      );
    }
  };

  const handleLogout = () => {
    setLoginStatus((prev) => !prev);
    setUser(null);
  };

  return { handleLogin, handleLogout };
};
