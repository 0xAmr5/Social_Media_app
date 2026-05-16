import mongoose from "mongoose";
import availabiltyEnum from "../../common/enum/availablity.enum";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export interface IPost {
  content: string;
  attachments?: string[];
  createdBy: mongoose.Schema.Types.ObjectId;
  tags?: mongoose.Schema.Types.ObjectId[];
  reactions?: {
    user: mongoose.Schema.Types.ObjectId;
    type: ReactionType;
  }[];
  likes?: mongoose.Types.ObjectId[];
  allowComments?: string;
  availablity: string;
  folderId?: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const postSchema = new mongoose.Schema<IPost>(
  {
    content: { type: String, trim: true },
    attachments: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
          default: "like",
        },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    allowComments: { type: String, default: "allow" },
    availablity: { type: String, enum: Object.values(availabiltyEnum), default: availabiltyEnum.public },
    folderId: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

postSchema.pre(["findOne", "find"], function () {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid === true) {
    this.setQuery(rest);
  } else this.setQuery({ deletedAt: null, ...rest });
});

postSchema.pre("findOneAndDelete", async function () {
  const post = await this.model.findOne(this.getQuery()).lean();
  if (!post?._id) return;
  const Comment = mongoose.models.comments;
  if (Comment) {
    await Comment.deleteMany({ post: post._id });
  }
});

const postModel = mongoose.models.posts || mongoose.model("posts", postSchema);

export default postModel;
