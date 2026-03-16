import express from "express";
import getUserProfile from "@/user-role/controllers/user/profile/getProfile";
import { updateBasicInfo } from "@/user-role/controllers/user/profile/updateBasic";
import { deactivateAccount } from "@/user-role/controllers/user/account/deactivateAccount";
import followUser from "@/user-role/controllers/user/socials/followUser";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { getFollowers } from "@/user-role/controllers/user/socials/getFollowers";
import { changeEmail } from "@/user-role/controllers/user/email/changeEmail";
import { changePassword } from "@/user-role/controllers/user/changePassword";
import { updateDemoInfo } from "@/user-role/controllers/user/profile/updateDemo";
import { changeUserImage } from "@/user-role/controllers/user/profile/changeImage";
import { changeUsername } from "@/user-role/controllers/user/changeUsername";
import { cancelEmailChange } from "@/user-role/controllers/user/email/cancelChange";
import { removeUserImage } from "@/user-role/controllers/user/profile/removeImage";

const router = express.Router();

// User Info
router.get("/:id", getUserProfile);
router.patch("/update-basic", verifyAuthToken, updateBasicInfo);
router.patch("/update-demo", verifyAuthToken, updateDemoInfo);
router.patch("/change-image", verifyAuthToken, changeUserImage);
router.delete("/delete-image", verifyAuthToken, removeUserImage);

// User Account
router.patch("/change-email", verifyAuthToken, changeEmail);
router.patch("/change-username", verifyAuthToken, changeUsername);
router.patch("/change-password", verifyAuthToken, changePassword);
router.post("/cancel-email-change", verifyAuthToken, cancelEmailChange);
router.delete("/", verifyAuthToken, deactivateAccount);

// Update User Socials
router.post("/:id/follow", verifyAuthToken, followUser);
router.get("/:id/followers", verifyAuthToken, getFollowers);

export default router;
