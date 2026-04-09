import express, { Router } from "express";
import getUserProfile from "./controllers/profile/getProfile";
import { updateBasicInfo } from "./controllers/profile/updateBasic";
import { verifyAuthToken } from "@repo/shared";
import { updateDemoInfo } from "./controllers/profile/updateDemo";
import { changeUserImage } from "./controllers/profile/changeImage";
import { removeUserImage } from "./controllers/profile/removeImage";
import { changeEmail } from "./controllers/email/changeEmail";
import { changeUsername } from "./controllers/changeUsername";
import { changePassword } from "./controllers/changePassword";
import { cancelEmailChange } from "./controllers/email/cancelChange";
import { deactivateAccount } from "./controllers/account/deactivateAccount";
import { getFollowers } from "./controllers/socials/getFollowers";
import { followUser } from "./controllers/socials/followUser";

const router: Router = express.Router();

// Testing api.funstakes.net/user
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes User API" });
});

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
