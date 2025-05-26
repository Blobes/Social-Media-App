import postModel from "../../models/post-model.js";
import userModel from "../../models/user-model.js";

const createPost = async (req, res) => {
  const { userId, description } = req.body;
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }
    const newPost = postModel({
      userId,
      description,
    });

    await newPost.save();
    return res
      .status(201)
      .json({ newPost, message: "Post created successfully" });
  } catch (error) {
    return res.status(500).json("Internal server error");
  }
};

export default createPost;
