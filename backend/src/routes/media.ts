import { getUploadUrl } from "@/controllers/media/getUploadUrl";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import express from "express";

const router = express.Router();

router.post("/get-upload-url", verifyAuthToken, getUploadUrl);

export default router;
