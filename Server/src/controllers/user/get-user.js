import mongoose from "mongoose";
import UserModel from "../../models/user-model.js";

//Get a user
const getUser = async (req, res) => {
  const id = req.params.id;

  // Validate the ID format if using MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await UserModel.findById(id);
    if (user) {
      const { password, ...otherInfo } = user._doc;
      return res.status(200).json(otherInfo);
    } else {
      return res.status(404).json("User not found");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default getUser;
