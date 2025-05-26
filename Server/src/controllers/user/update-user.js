import mongoose from "mongoose";
import UserModel from "../../models/user-model.js";
import bcrypt from "bcrypt";

const updateUser = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json("User format not valid");
  }

  const { currentUserId, userAdminStatus, currentPassword, newPassword } =
    req.body;
  try {
    const user = await UserModel.findById(id);
    if (user) {
      if (currentUserId !== id && !userAdminStatus) {
        return res
          .status(401)
          .json("You don't have the permission to edit this user");
      }

      // Update password if exist
      if (newPassword) {
        const { password: dbPassword } = user._doc;
        const salt = await bcrypt.genSalt(10);
        const isValid = await bcrypt.compare(currentPassword, dbPassword);
        if (!isValid && !userAdminStatus) {
          return res.status(401).json("The password you provided is incorrect");
        }
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await UserModel.findByIdAndUpdate(
          id,
          { password: newPasswordHash },
          {
            new: true,
          }
        );
      }

      // Update user details except password
      const updatedUser = await UserModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      const { password, ...userDetails } = updatedUser._doc;
      return res.status(200).json({
        message: "User details updated successfully",
        user: userDetails,
      });
    } else {
      return res.status(404).json("User not found");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export default updateUser;
