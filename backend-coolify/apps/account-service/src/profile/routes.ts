import express, { Router } from "express";
import { updateBasicInfo } from "./info/controllers/updateBasic";
import { updateDemoInfo } from "./info/controllers/updateDemo";
import { changeUserImage } from "./media/controllers/changeImage";
import { removeUserImage } from "./media/controllers/removeImage";
import { changeUsername } from "./username/change";
import { setPassword } from "./password/controllers/setPassword";
import { cancelEmailChange } from "./email/controllers/cancelChange";
import { getFollowers } from "./socials/controllers/getFollowers";
import { followUser } from "./socials/controllers/followUser";
import { finalizeEmailChange } from "./email/controllers/finalizeChange";
import { finalizePhoneChange } from "./phone/controllers/finalizeChange";
import { authenticate, optionallyAuthenicate } from "@/envVars";
import { getUserProfile } from "./info/controllers/getProfile";
import { reviewVerification } from "./id-doc/controllers/reviewID";
import { submitIdDoc } from "./id-doc/controllers/docSubmission";
import { changeAccountStatus } from "./account/accountStatus";
import { deleteAccount } from "./account/deleteAccount";
import { initiatePasswordReset } from "./password/controllers/initiateReset";
import { initiateEmailChange } from "./email/controllers/initiateChange";
import { initiatePhoneChange } from "./phone/controllers/initiateChange";

const router: Router = express.Router();

// Testing api.funstakes.net/identity
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes User API" });
});

// User Info
router.get("/:id", getUserProfile);
router.patch("/update/basic", authenticate, updateBasicInfo);
router.patch("/update/demo", authenticate, updateDemoInfo);
router.patch("/update/profile-image", authenticate, changeUserImage);
router.delete("/delete/profile-image", authenticate, removeUserImage);

// User Account
router.post("/change-email/initiate", authenticate, initiateEmailChange);
router.patch("/change-email/finalize", authenticate, finalizeEmailChange);
router.post("/change-email/cancel", authenticate, cancelEmailChange);
router.post("/change-username", authenticate, changeUsername);
router.post("/change-phone/initiate", authenticate, initiatePhoneChange);
router.patch("/change-phone/finalize", authenticate, finalizePhoneChange);

router.post(
  "/reset-password/initiate",
  optionallyAuthenicate,
  initiatePasswordReset,
);
router.patch("/set-password", optionallyAuthenicate, setPassword);
router.patch("/account/status", authenticate, changeAccountStatus);
router.delete("/account/delete", authenticate, deleteAccount);

// Update User Socials
router.post("/:id/follow", authenticate, followUser);
router.get("/:id/followers", authenticate, getFollowers);

// ID Doc
router.patch("/review-doc", authenticate, reviewVerification);
router.patch("/submit-doc", authenticate, submitIdDoc);

export default router;
