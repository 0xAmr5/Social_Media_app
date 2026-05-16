import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import commentModel from "../../DB/models/comment.model";
import postModel from "../../DB/models/post.model";
import { ErrorForbidden, ErrorNotFound, SuccessResponse } from "../../common/utils/global-error-handler";

const isOwner = (req: Request, createdBy: unknown) => String(createdBy) === String(req.user?.id);
const isAdmin = (req: Request) => req.user?.role === "admin";

class CommentService {
  create = async (req: Request, res: Response, _next: NextFunction) => {
    const post = await postModel.findById(req.body.postId);
    if (!post) ErrorNotFound("post not found");
    if (post!.allowComments === "Dont-allow") ErrorForbidden("comments are closed for this post");

    const comment = await commentModel.create({
      content: req.body.content,
      post: req.body.postId,
      parentComment: req.body.parentComment,
      createdBy: req.user?.id,
    });
    SuccessResponse({ res, statusCode: 201, data: comment });
  };

  listByPost = async (req: Request, res: Response, _next: NextFunction) => {
    const comments = await commentModel
      .find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "userName email")
      .lean();
    SuccessResponse({ res, data: comments });
  };

  getById = async (req: Request, res: Response, _next: NextFunction) => {
    const comment = await commentModel
      .findById(req.params.id)
      .populate("createdBy", "userName email")
      .lean();
    if (!comment) ErrorNotFound("comment not found");
    SuccessResponse({ res, data: comment });
  };

  update = async (req: Request, res: Response, _next: NextFunction) => {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) ErrorNotFound("comment not found");
    if (!isOwner(req, comment!.createdBy) && !isAdmin(req)) ErrorForbidden("you can update your comments only");
    comment!.content = req.body.content ?? comment!.content;
    await comment!.save();
    SuccessResponse({ res, data: comment });
  };

  react = async (req: Request, res: Response, _next: NextFunction) => {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) ErrorNotFound("comment not found");
    const type = ["like", "love", "haha", "wow", "sad", "angry"].includes(req.body.type) ? req.body.type : "like";
    comment!.reactions = (comment!.reactions ?? []).filter((reaction: any) => String(reaction.user) !== String(req.user?.id));
    comment!.reactions.push({ user: new Types.ObjectId(req.user?.id), type } as any);
    await comment!.save();
    SuccessResponse({ res, data: comment });
  };

  softDelete = async (req: Request, res: Response, _next: NextFunction) => {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) ErrorNotFound("comment not found");
    if (!isOwner(req, comment!.createdBy) && !isAdmin(req)) ErrorForbidden("you can delete your comments only");
    comment!.deletedAt = new Date();
    await comment!.save();
    SuccessResponse({ res, data: "comment soft deleted" });
  };

  hardDelete = async (req: Request, res: Response, _next: NextFunction) => {
    const comment = await commentModel.findOneAndDelete({ _id: req.params.id });
    if (!comment) ErrorNotFound("comment not found");
    SuccessResponse({ res, data: "comment hard deleted" });
  };
}

export default new CommentService();
