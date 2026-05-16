import type { Request, Response, NextFunction } from "express";
import UserModel from "../user.model";
import { GlobalCompare, Globalhash } from "../../../common/security/hash";
import { ErrorForbidden, ErrorNotFound, SuccessResponse } from "../../../common/utils/global-error-handler";

const isAdmin = (req: Request) => req.user?.role === "admin";

class UserServices {
  getMe(req: Request, res: Response, _next: NextFunction) {
    SuccessResponse({ res, data: req.user });
  }

  async listUsers(req: Request, res: Response, _next: NextFunction) {
    const users = await UserModel.find({ paranoid: true }).select("-password").sort({ createdAt: -1 }).lean();
    SuccessResponse({ res, data: users });
  }

  async getUserById(req: Request, res: Response, _next: NextFunction) {
    const user = await UserModel.findById(req.params.id).select("-password").lean();
    if (!user) ErrorNotFound("user not found");
    SuccessResponse({ res, data: user });
  }

  async updateProfile(req: Request, res: Response, _next: NextFunction) {
    const allowed = ["userName", "age", "phone", "address", "gender"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await UserModel.findByIdAndUpdate(req.user?.id, update, { new: true }).select("-password");
    if (!user) ErrorNotFound("user not found");
    SuccessResponse({ res, data: user });
  }

  async updateUserByAdmin(req: Request, res: Response, _next: NextFunction) {
    const allowed = ["userName", "age", "phone", "address", "gender", "role", "friends"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) ErrorNotFound("user not found");
    SuccessResponse({ res, data: user });
  }

  async updatePassword(req: Request, res: Response, _next: NextFunction) {
    const user = await UserModel.findById(req.user?.id).select("+password");
    if (!user) ErrorNotFound("user not found");
    if (!GlobalCompare({ plainText: req.body.oldPassword, hashText: user!.password })) {
      ErrorForbidden("old password is wrong");
    }
    user!.password = Globalhash({ plainText: req.body.newPassword });
    await user!.save();
    SuccessResponse({ res, data: "password updated" });
  }

  async softDelete(req: Request, res: Response, _next: NextFunction) {
    const id = (req.params.id || req.user?.id) as string;
    if (!isAdmin(req) && String(id) !== String(req.user?.id)) ErrorForbidden("you can delete your account only");
    const user = await UserModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!user) ErrorNotFound("user not found");
    SuccessResponse({ res, data: "user soft deleted" });
  }

  async hardDelete(req: Request, res: Response, _next: NextFunction) {
    const user = await UserModel.findOneAndDelete({ _id: req.params.id as string });
    if (!user) ErrorNotFound("user not found");
    SuccessResponse({ res, data: "user hard deleted" });
  }

  async logout(req: Request, res: Response, _next: NextFunction) {
    SuccessResponse({ res, data: "logout route is ready" });
  }
}

export default new UserServices();
