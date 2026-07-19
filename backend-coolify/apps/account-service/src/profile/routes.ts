import express, { Router } from "express";
import { updateBasicInfo } from "./info/controllers/updateBasic";
import { updateDemoInfo } from "./info/controllers/updateDemo";
import { changeUserImage } from "./media/controllers/changeImage";
import { removeUserImage } from "./media/controllers/removeImage";
import { changeEmail } from "./email/controllers/changeEmail";
import { changeUsername } from "./username/change";
import { setPassword } from "./password/controllers/setPassword";
import { cancelEmailChange } from "./email/controllers/cancelChange";
import { getFollowers } from "./socials/controllers/getFollowers";
import { followUser } from "./socials/controllers/followUser";
import { verifyEmailUpdate } from "./email/controllers/verifyEmailUpdate";
import { verifyPhoneUpdate } from "./phone/controllers/verifyPhone";
import { authenticate } from "@/envVars";
import { getUserProfile } from "./info/controllers/getProfile";
import { reviewVerification } from "./id-doc/controllers/reviewID";
import { submitIdDoc } from "./id-doc/controllers/docSubmission";
import { isAdmin } from "@repo/security";
import { changeAccountStatus } from "./account/accountStatus";
import { deleteAccount } from "./account/deleteAccount";
import { initiatePasswordReset } from "./password/controllers/initiateReset";

const router: Router = express.Router();

// Testing api.funstakes.net/identity
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes User API" });
});

// User Info
router.get("/:id", getUserProfile);
router.patch("/update-basic", authenticate, updateBasicInfo);
router.patch("/update-demo", authenticate, updateDemoInfo);
router.patch("/change-image", authenticate, changeUserImage);
router.delete("/delete-image", authenticate, removeUserImage);

// User Account
router.patch("/change-email", authenticate, changeEmail);
router.patch("/change-username", authenticate, changeUsername);
router.put("/verify-email", authenticate, verifyEmailUpdate);
router.put("/verify-phone", authenticate, verifyPhoneUpdate);
router.patch("/reset-password", authenticate, initiatePasswordReset);
router.patch("/set-password", authenticate, setPassword);
router.post("/cancel-email-change", authenticate, cancelEmailChange);
router.patch("/change-account-status", authenticate, changeAccountStatus);
router.delete("/delete-account", authenticate, deleteAccount);

// Update User Socials
router.post("/:id/follow", authenticate, followUser);
router.get("/:id/followers", authenticate, getFollowers);

// ID Doc
router.patch("/review-doc", authenticate, isAdmin, reviewVerification);
router.patch("/submit-doc", authenticate, isAdmin, submitIdDoc);

export default router;
