import express from "express";
import { createAccount } from "@/controllers/auth/createAccount";
import loginUser from "@/controllers/auth/login";
import { refreshAuthToken } from "@/middlewares/refreshAuthToken";
import { checkUsername, checkEmail } from "@/controllers/auth/check";
import { verifyUser } from "@/controllers/auth/verifyUser";
import logoutUser from "@/controllers/auth/logout";
import { verifyEmail } from "@/controllers/auth/emailVerification";
import verifyAuthToken from "@/middlewares/verifyAuthToken";

const router = express.Router();

//Register route
router.post("/register", createAccount);

//Check email & username unique route during registration
router.post("/check-email", checkEmail);
router.get("/check-username", checkUsername);

//Login route
router.post("/login", loginUser);

//Logout route
router.post("/logout", logoutUser);

//Verify user route
router.get("/verify", verifyAuthToken, verifyUser);

//Refresh token route
router.post("/refresh", refreshAuthToken);

//Verify code sent to user email during signup
router.put("/verify-email-code", verifyEmail);

export default router;
