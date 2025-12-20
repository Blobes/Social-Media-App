import express from "express";
import getUser from "@/controllers/user/getUser";
import {
  updateUserInfo,
  updateUserEmail,
  updateUserPassword,
} from "@/controllers/user/updateUser";
import { deleteUser } from "@/controllers/user/deleteUser";
import followUser from "@/controllers/user/followUser";
import verifyToken from "@/middlewares/verifyToken";
import { getUserPosts } from "@/controllers/user/getUserPosts";
import { getFollowersPosts } from "@/controllers/user/getFollowersPosts";
import { getFollowers } from "@/controllers/user/getFollowers";

const router = express.Router();

router.get("/:id", getUser);
router.put("/:id/update-user-info", verifyToken, updateUserInfo);
router.put("/:id/update-user-email", verifyToken, updateUserEmail);
router.put("/:id/update-user-password", verifyToken, updateUserPassword);
router.delete("/:id", verifyToken, deleteUser);
router.put("/:id/follow", verifyToken, followUser);
router.get("/:id/followers", verifyToken, getFollowers);
router.get("/:id/posts", verifyToken, getUserPosts);
router.get("/:id/followers-posts", verifyToken, getFollowersPosts);

export default router;
