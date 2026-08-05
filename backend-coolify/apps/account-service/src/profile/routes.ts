import express, { Router } from "express";
import { updateBasicInfo } from "./info/controllers/updateBasic";
import { updateDemoInfo } from "./info/controllers/updateDemo";
import { changeUserImage } from "./media/controllers/changeImage";
import { removeUserImage } from "./media/controllers/removeImage";
import { changeUsername } from "./username/controller";
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
import { autoInvalidateUserCache } from "@repo/shared";
import { getUserSettings } from "./settings/general/controller";
import { updateDisplaySettings } from "./settings/display/controller";
import { updateNotificationSettings } from "./settings/notifications/controller";
import { updatePrivacySettings } from "./settings/privacy/controller";
import {
  addMutedWords,
  removeMutedWordsHandler,
} from "./settings/muted-words/controller";
import { removeUserTopics } from "./settings/topic/remove";
import { syncUserTopics } from "./settings/topic/update";

const router: Router = express.Router();

// Testing api.funstakes.net/identity
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes User API" });
});

// User Info
router.get("/:id", getUserProfile);
router.patch(
  "/update/basic",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateBasicInfo,
);
router.patch(
  "/update/demo",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateDemoInfo,
);
router.patch(
  "/update/profile-image",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  changeUserImage,
);
router.delete(
  "/delete/profile-image",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  removeUserImage,
);

// User Account
router.post("/change-email/initiate", authenticate, initiateEmailChange);
router.patch(
  "/change-email/finalize",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  finalizeEmailChange,
);
router.post("/change-email/cancel", authenticate, cancelEmailChange);

router.post(
  "/change-username",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  changeUsername,
);
router.post("/change-phone/initiate", authenticate, initiatePhoneChange);

router.patch(
  "/change-phone/finalize",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  finalizePhoneChange,
);

router.post(
  "/reset-password/initiate",
  optionallyAuthenicate,
  initiatePasswordReset,
);

router.patch(
  "/set-password",
  optionallyAuthenicate,
  autoInvalidateUserCache("SESSIONS_REVOKE_ALL"),
  setPassword,
);

// Invalidation is handled at the service logic level
router.patch("/account/status", authenticate, changeAccountStatus);

router.delete(
  "/account/delete",
  authenticate,
  autoInvalidateUserCache("CRITICAL_UPDATE"),
  deleteAccount,
);

// Update User Socials
router.post(
  "/:id/follow",
  authenticate,
  autoInvalidateUserCache("SOCIAL_RELATIONSHIP_UPDATE"),
  followUser,
);
router.get("/:id/followers", authenticate, getFollowers);

// ID Doc
router.patch(
  "/review-doc",
  authenticate,
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  reviewVerification,
);
router.patch(
  "/submit-doc",
  authenticate,
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  submitIdDoc,
);

// Settings operations
router.get("/settings", authenticate, getUserSettings);
router.patch(
  "/settings/display",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  updateDisplaySettings,
);
router.patch(
  "/settings/notifications",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  updateNotificationSettings,
);
router.patch(
  "/settings/privacy",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  updatePrivacySettings,
);

// Content mute filter operations
router.post(
  "/settings/muted-words",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  addMutedWords,
);
router.delete(
  "/settings/muted-words",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  removeMutedWordsHandler,
);

// User Topics
router.patch(
  "/settings/topic",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  syncUserTopics,
);
router.delete(
  "/settings/topic",
  authenticate,
  autoInvalidateUserCache("USER_SETTINGS"),
  removeUserTopics,
);

export default router;
