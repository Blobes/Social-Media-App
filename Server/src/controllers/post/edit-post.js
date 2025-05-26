import mongoose from "mongoose";
import postModel from "../../models/post-model.js";

const editPost = async (req, res) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json("Post ID format not valid");
  }

  const { currentUserId, description } = req.body;

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json("Post not found");
    }
    if (currentUserId !== post.userId) {
      return res.status(404).json("You are not permitted to edit this post!");
    }

    await post.updateOne({ description: description });
    return res.status(200).json("Updated successfully.");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default editPost;
