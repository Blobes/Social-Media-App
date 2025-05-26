import mongoose from "mongoose";
import UserModel from "../../models/user-model.js";

const followUser = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json("User format not valid");
  }

  const { currentUserId } = req.body;

  try {
    const toBeFollowed = await UserModel.findById(id);
    const currentUser = await UserModel.findById(currentUserId);
    if (!toBeFollowed || !currentUser) {
      return res.status(404).json("User not found");
    }
    if (currentUserId === id) {
      return res.status(403).json("You can't follow yourself");
    }

    if (!toBeFollowed.followers.includes(currentUserId)) {
      //   return res.status(403).json("You are already following this user.");
      await toBeFollowed.updateOne({ $push: { followers: currentUserId } });
      await currentUser.updateOne({ $push: { following: id } });
      return res.status(200).json("Followed successfully.");
    } else {
      await toBeFollowed.updateOne({ $pull: { followers: currentUserId } });
      await currentUser.updateOne({ $pull: { following: id } });
      return res.status(200).json("You unfollowed successfully.");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default followUser;
