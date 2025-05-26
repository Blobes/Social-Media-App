import express from "express";
import registerUser from "@/controllers/auth/register";
import loginUser from "@/controllers/auth/login";
import { refreshToken } from "@/controllers/auth/refreshToken";
import { checkUsername, checkEmail } from "@/controllers/auth/check";

const router = express.Router();

//Register route
router.post("/register", registerUser);

//Check email & username unique route during registration
router.get("/check-email", checkEmail);
router.get("/check-username", checkUsername);

//Login route
router.post("/login", loginUser);

//Refresh token route
router.post("/refresh", refreshToken);

export default router;
