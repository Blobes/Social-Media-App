import express from "express";
import getUser from "../controllers/user/get-user.js";
import updateUser from "../controllers/user/update-user.js";
import deleteUser from "../controllers/user/delete-user.js";
import followUser from "../controllers/user/follow-user.js";
import verifyToken from "@/middlewares/verifyToken.js";

const router = express.Router();

router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
router.put("/:id/follow", verifyToken, followUser);

export default router;
