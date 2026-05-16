import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import commentService from "./comment.service";

const commentRouter = Router();

commentRouter.use(authenticate);
commentRouter.post("/", commentService.create);
commentRouter.get("/post/:postId", commentService.listByPost);
commentRouter.get("/:id", commentService.getById);
commentRouter.patch("/:id", commentService.update);
commentRouter.patch("/:id/react", commentService.react);
commentRouter.delete("/:id/soft", commentService.softDelete);
commentRouter.delete("/:id/hard", authorize(["admin"]), commentService.hardDelete);

export default commentRouter;
