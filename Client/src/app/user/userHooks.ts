"use client";

import { useAppContext } from "@/app/AppContext";
import { userData as users } from "@/data/userData";
import { useFeedback } from "@/shared/sharedHooks";

export const useUser = () => {
  const { user: me, setUser } = useAppContext();
  const { setFbMessage } = useFeedback();

  const handleFollow = async (userInvolvedId: string) => {
    const userInvolved = users.find((user) => user.id === userInvolvedId);
    //const myData = users.find((user) => user.email === me!.email);

    if (!me || !userInvolved) {
      setFbMessage({ timedMessage: "User not found!" }, "ERROR", 500);
      return;
    }
    if (userInvolved.followers.includes(me._id)) {
      const updatedFollowers = userInvolved.followers.filter(
        (follower: string) => {
          return follower !== me._id;
        }
      );
      userInvolved.followers = updatedFollowers;

      const myFollowings = me.following!.filter((userFollowing) => {
        return userFollowing !== userInvolved.id;
      });
      me.following = myFollowings;
      setFbMessage(
        { timedMessage: "Unfollowed successfully!" },
        "SUCCESS",
        500
      );
    } else {
      userInvolved.followers = [...userInvolved.followers, me._id];
      me.following = [...me.following!, userInvolved.id];
      setFbMessage({ timedMessage: "Followed successfully!" }, "SUCCESS", 500);
    }
    setUser(me);
  };

  return { handleFollow };
};
