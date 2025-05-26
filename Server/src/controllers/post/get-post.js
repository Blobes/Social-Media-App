import postModel from "../../models/post-model.js";
import mongoose from "mongoose";

const getPost = async (req, res) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json("Post ID format not valid");
  }
  try {
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json("Post not found");
    }
    res.status(201).json({
      message: "Post found!",
      content: post,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default getPost;
