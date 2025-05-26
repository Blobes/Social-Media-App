import mongoose from "mongoose";
import postModel from "../../models/post-model.js";
import userModel from "../../models/user-model.js";

const postTimeline = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json("Post ID format not valid");
  }

  try {
    const currentUserPosts = await postModel.find({ userId: userId });
    const otherUserPosts = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "following",
          foreignField: "userId",
          as: "followingPosts",
        },
      },
      {
        $project: {
          followingPosts: 1,
          _id: 0,
        },
      },
    ]);

    const { followingPosts } = otherUserPosts[0];

    if (currentUserPosts.length < 1 && followingPosts.length < 1) {
      return res.status(404).json("No post not found!");
    }

    if (currentUserPosts.length > 0 && followingPosts.length > 0) {
      return res.status(200).json({
        message: "All Posts found!",
        content: currentUserPosts.concat(followingPosts),
      });
    }

    const somePosts =
      currentUserPosts.length > 0 ? currentUserPosts : followingPosts;

    return res.status(200).json({
      message: "Some Posts found!",
      content: somePosts,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default postTimeline;
