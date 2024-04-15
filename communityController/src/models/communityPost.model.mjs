import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const communityPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    commentCount: {
      type: Number,
      required: false,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
export default CommunityPost;
