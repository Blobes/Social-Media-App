import mongoose from "mongoose";
import UserModel from "../../models/user-model.js";

const deleteUser = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json("User format not valid");
  }

  const { currentUserId, userAdminStatus } = req.body;
  try {
    if (currentUserId !== id && !userAdminStatus) {
      return res
        .status(401)
        .json("You don't have the permission to delete this user");
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json("user not found");
    }

    await UserModel.findByIdAndDelete(id);
    return res.status(200).json("User deleted successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default deleteUser;
