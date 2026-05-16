import { Router } from "express";
import { authenticate } from "../../../common/utils/middleware/authenticate";
import userServices from "./user.services";
import { updatePasswordSchema } from "./user.Schema";
import { validationMiddleWare } from "../../../common/utils/middleware/validation";
import { authorize } from "../../../common/middleware/authorize";

export const userRouter : Router = Router();



userRouter.patch(
  "/update-password",
  validationMiddleWare(updatePasswordSchema),
  authenticate,
  userServices.updatePassword
);

userRouter.get("/me", authenticate, userServices.getMe);
userRouter.get("/dashboard", authenticate, authorize(["admin"]), userServices.listUsers);
userRouter.get("/log-out", authenticate ,userServices.logout);
userRouter.get("/:id", authenticate, authorize(["admin"]), userServices.getUserById);
userRouter.patch("/me", authenticate, userServices.updateProfile);
userRouter.patch("/:id", authenticate, authorize(["admin"]), userServices.updateUserByAdmin);
userRouter.delete("/me/soft", authenticate, userServices.softDelete);
userRouter.delete("/:id/soft", authenticate, authorize(["admin"]), userServices.softDelete);
userRouter.delete("/:id/hard", authenticate, authorize(["admin"]), userServices.hardDelete);
