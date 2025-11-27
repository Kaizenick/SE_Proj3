import express from "express";
import { loginUser, registerUser,registerDriver,loginDriver, } from "../controllers/userController.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/register-driver", registerDriver);
userRouter.post("/login-driver", loginDriver);
export default userRouter;
