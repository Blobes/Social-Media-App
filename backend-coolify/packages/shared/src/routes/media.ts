import express from "express";
import { verifyAuthToken } from "../middlewares/authToken";
import { getUploadUrl } from "../controller/media/getUploadUrl";

export const mediaRouter = () => {
  const router = express.Router();

  router.post("/get-upload-url", verifyAuthToken, getUploadUrl);

  return router;
};
