import mongoose from "mongoose";
import postModel from "../../models/post-model.js";
import userModel from "../../models/user-model.js";

const likePost = async (req, res) => {
  const postId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json("Post ID format not valid");
  }

  const { currentUserId } = req.body;

  try {
    const currentUser = await userModel.findById(currentUserId);
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json("Post not found");
    }
    if (!currentUser) {
      return res.status(404).json("Login to like this post!");
    }

    if (!post.likes.includes(currentUserId)) {
      await post.updateOne({ $push: { likes: currentUserId } });
      return res.status(200).json("Liked successfully.");
    } else {
      await post.updateOne({ $pull: { likes: currentUserId } });
      return res.status(200).json("Unliked post!.");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default likePost;
