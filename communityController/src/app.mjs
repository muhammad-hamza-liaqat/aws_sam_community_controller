import { StatusCodes } from "http-status-codes";
import { HTTPResponse, catchTryAsyncErrors } from "./helper.mjs";
import CommunityPost from "./models/communityPost.model.mjs";
import mongoose from "mongoose";

var userId = "65d58c02ff92538d09c4b81a";

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const queryParams = event.queryStringParameters || {};
    const body = JSON.parse(event.body || "{}");

    // Establish MongoDB connection using Mongoose
    await mongoose.connect(process.env.MONGODB_URI, {
    });

    switch (method) {
      case "POST":
        if (path === "/addCommunityPost") {
          return catchTryAsyncErrors(addCommunityPost)(body);
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
