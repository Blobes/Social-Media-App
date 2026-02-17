import express from "express";
import getUser from "@/controllers/user/getUser";
import {
  updateUserInfo,
  updateUserEmail,
  updateUserPassword,
} from "@/controllers/user/updateUser";
import { deleteUser } from "@/controllers/user/deleteUser";
import followUser from "@/controllers/user/followUser";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { getUserPosts } from "@/controllers/user/getUserPosts";
import { getFollowersPosts } from "@/controllers/user/getFollowersPosts";
import { getFollowers } from "@/controllers/user/getFollowers";

const router = express.Router();

router.get("/:id", getUser);
router.put("/:id/update-user-info", verifyAuthToken, updateUserInfo);
router.put("/:id/update-user-email", verifyAuthToken, updateUserEmail);
router.put("/:id/update-user-password", verifyAuthToken, updateUserPassword);
router.delete("/:id", verifyAuthToken, deleteUser);
router.put("/:id/follow", verifyAuthToken, followUser);
router.get("/:id/followers", verifyAuthToken, getFollowers);
router.get("/:id/posts", verifyAuthToken, getUserPosts);
router.get("/:id/followers-posts", verifyAuthToken, getFollowersPosts);

export default router;
