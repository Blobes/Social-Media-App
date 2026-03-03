import express from "express";
import getUser from "@/controllers/user/profile/getUser";
import { updateUserInfo } from "@/controllers/user/profile/updateInfo";
import { deleteUser } from "@/controllers/user/account/deleteAccount";
import followUser from "@/controllers/user/account/followUser";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { getFollowers } from "@/controllers/user/account/getFollowers";
import { updateUserEmail } from "@/controllers/user/account/updateEmail";
import { updateUserPassword } from "@/controllers/user/account/updatePassword";

const router = express.Router();

router.get("/:id", getUser);
router.put("/:id/update-info", verifyAuthToken, updateUserInfo);
router.put("/:id/update-email", verifyAuthToken, updateUserEmail);
router.put("/:id/update-password", verifyAuthToken, updateUserPassword);
router.delete("/:id", verifyAuthToken, deleteUser);
router.put("/:id/follow", verifyAuthToken, followUser);
router.get("/:id/followers", verifyAuthToken, getFollowers);

export default router;
