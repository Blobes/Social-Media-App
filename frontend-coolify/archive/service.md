"use client";

import { useCallback } from "react";
import { apiClient } from "@repo/helpers";
import { API_BASE, IListPayload, IPost } from "@repo/core";

/\*\*

- Service to handle feed-related API interactions.
  \*/
  export const FeedService = () => {
  /\*\*
  - Fetches the unified feed with support for pagination.
    \*/
    const fetchFeed = useCallback(
    async (
    page: number = 1,
    limit: number = 20,
    ): Promise<IListPayload<IPost>> => {
    try {
    const url = `${API_BASE.feed}?page=${page}&limit=${limit}`;

          const res = await apiClient<IListPayload<IPost>>(url, {
            method: "GET",
          });

          return {
            status: res.status,
            payload: res.payload ?? [],
            message: res.message,
            metaData: res.metaData,
          };
        } catch (error: any) {
          console.error("Feed Service Error:", error);
          return {
            status: error.status || "ERROR",
            payload: null,
            message:
              error.message ?? "Something went wrong while fetching the feed",
          };
        }

    },
    [],
    );

return {
fetchFeed,
};
};

Using the established login code design, existing structure and functionalities in the attached .md file, implement the sign up/create account frontend feature. The sign up service should return the tokens and user data payload if the sign up is successful so that the hook can store it in the user ui state. So that when the user is sent to the otp screens for verification they don't have to login again.
The sign up should not exactly replicate the login functionality. The sign up should not make use of the stepper approach, it should use
just one component (Signup.tsx) for all its ui properties. It also does not need the ui locking functionality since the password is meant to be used for account creation. The sign up should use only two hooks useSignup and useSignupFeedback. Also make use of the ui guide component for the password validation by placing it below the password field. Utilize the functionality in the ui guide component to show real time validation progress to the user.

These are what you should focus on for now:
export const useSignup = () => {}
export const SignupService = () => {}
export const Signup = () => {}
export const useSignupFeedback = () => {}
