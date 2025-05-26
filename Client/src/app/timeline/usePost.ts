"use client";

import { useAppContext } from "@/app/AppContext";
import { postData as posts } from "@/data/postData";
import { useFeedback } from "@/shared/sharedHooks";

export const usePost = () => {
  const { user } = useAppContext();
  const { setFbMessage } = useFeedback();

  const handlePostLike = async (postId: string) => {
    const post = posts.find((post) => post.id === postId); //Api call to get post
    if (!user || !post) {
      setFbMessage({ timedMessage: "Post not found!" }, "ERROR", 500);
      return;
    }
    if (post.likes.includes(user._id)) {
      const updatedLikes = post.likes.filter((id: string) => {
        return id !== user._id;
      });
      post.likes = updatedLikes;
      setFbMessage({ timedMessage: "Unliked!" }, "SUCCESS", 500);
    } else {
      post.likes = [...post.likes, user._id];
      setFbMessage({ timedMessage: "Liked!" }, "SUCCESS", 500);
    }
  };

  return { handlePostLike };
};
