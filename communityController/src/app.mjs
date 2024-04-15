import { StatusCodes } from "http-status-codes";
import { HTTPResponse, HTTPError, catchTryAsyncErrors } from "./helper.mjs";
import CommunityPost from "./models/communityPost.model.mjs";
import mongoose from "mongoose";


const userId = "65d58c02ff92538d09c4b81a";


export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const queryParams = event.queryStringParameters || {};
    const body = JSON.parse(event.body || "{}");
    await mongoose.connect(process.env.MONGODB_URI, {});

    switch (method) {
      case "POST":
        if (path === "/addCommunityPost") {
          return catchTryAsyncErrors(addCommunityPost)(body);
        } else if (path.startsWith("/addCommentOnPost/")) {
          const postId = path.split("/").pop();
          console.log("Extracted postId:", postId); // Log the extracted postId

          return catchTryAsyncErrors(addCommentOnPost)(postId, body);
        }
        break;
      default:
        return {
          statusCode: StatusCodes.METHOD_NOT_ALLOWED,
          body: JSON.stringify({
            message: "Endpoint not allowed",
          }),
        };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: "Something Went Wrong" }),
    };
  }
};

export const addCommunityPost = async (body) => {
  const user = new mongoose.Types.ObjectId(userId);
  const newPost = new CommunityPost({ ...body, user });

  await newPost.save();

  const response = new HTTPResponse(
    "Community Post created successfully!",
    newPost
  );

  return {
    statusCode: StatusCodes.CREATED,
    body: JSON.stringify(response),
  };
};

export const addCommentOnPost = async (postId, body) => {
    const communityPost = await CommunityPost.findById(postId);
    if (!communityPost) {
      throw new HTTPError("Community Post not found!", StatusCodes.NOT_FOUND);
    }
    const newComment = {
      _id: new mongoose.Types.ObjectId(), 
      user: userId,
      comment: body.comment, 
    };
    communityPost.comments.push(newComment);
    communityPost.commentCount += 1;
    await communityPost.save();

    const response = new HTTPResponse("Comment Added On Post!", communityPost);
    return {
      statusCode: StatusCodes.CREATED,
      body: JSON.stringify(response),
    };

};


