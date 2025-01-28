"use client";

import { useAppContext } from "@/app/AppContext";
import { userData as users } from "@/data/userData";
import { useHooks } from "@/shared/hooks/useHooks";

export const useUser = () => {
  const { user: me, setUser } = useAppContext();
  const { setFeedbackMessage } = useHooks();

  const handleFollow = async (userInvolvedId: string) => {
    const userInvolved = users.find((user) => user.id === userInvolvedId);
    const myData = users.find((user) => user.id === me!.id);

    if (!myData || !userInvolved) {
      setFeedbackMessage("User not found!", "ERROR", 500);
      return;
    }
    if (userInvolved.followers.includes(myData.id)) {
      const updatedFollowers = userInvolved.followers.filter((follower) => {
        return follower !== myData.id;
      });
      userInvolved.followers = updatedFollowers;

      const myFollowings = myData.following.filter((userFollowing) => {
        return userFollowing !== userInvolved.id;
      });
      myData.following = myFollowings;
      setFeedbackMessage("Unfollowed successfully!", "SUCCESS", 500);
    } else {
      userInvolved.followers = [...userInvolved.followers, myData.id];
      myData.following = [...myData.following, userInvolved.id];
      setFeedbackMessage("Followed successfully!", "SUCCESS", 500);
    }
    setUser(myData);
  };

  return { handleFollow };
};
