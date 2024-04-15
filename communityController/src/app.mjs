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
          // console.log("Extracted postId:", postId);
          return catchTryAsyncErrors(addCommentOnPost)(postId, body);
        }
        break;
      case "GET":
        if (path === "/getAllCommunityPost") {
          return catchTryAsyncErrors(getAllCommunityPost)(queryParams);
        } else if (path.startsWith("/getCommunityPostComment/")) {
          const postId = path.split("/").pop();
          return catchTryAsyncErrors(getCommunityPostComment)(
            postId,
            queryParams
          );
        } else if (path === "/getHotCommunityPost"){
          return catchTryAsyncErrors(getHotCommunityPost)(event)
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

export const getAllCommunityPost = async (queryParams) => {
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  let { filter = "latest" } = queryParams;
  // console.log("{incoming filter req.}=>", filter);

  const aggregationPipeline = [];

  if (filter === "latest") {
    aggregationPipeline.push({ $sort: { createdAt: -1 } });
  } else if (filter === "most_commented") {
    aggregationPipeline.push({ $sort: { commentCount: -1 } });
  } else if (filter === "oldest") {
    aggregationPipeline.push({ $sort: { createdAt: 1 } });
  }

  aggregationPipeline.push({
    $facet: {
      metadata: [{ $count: "total" }, { $addFields: { page, limit } }],
      data: [
        {
          $project: {
            _id: 0,
            commentCount: 1,
            title: 1,
            description: 1,
            comments: 1,
          },
        },
        { $skip: skip },
        { $limit: limit },
      ],
    },
  });

  const [result] = await CommunityPost.aggregate(aggregationPipeline).exec();

  const { metadata, data } = result || {
    metadata: [{ total: 0, page, limit }],
    data: [],
  };

  const response = new HTTPResponse("Success", {
    post: data,
    count: metadata.length > 0 ? metadata[0].total : 0,
  });
  console.log("record=>", data);
  return {
    statusCode: StatusCodes.OK,
    body: JSON.stringify(response),
  };
};

export const getCommunityPostComment = async (postId, queryParams) => {
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const post = await CommunityPost.findById(postId);
  const comments = post.comments.slice(skip, skip + limit);
  const totalPostCommentCount = post.commentCount;
  const response = new HTTPResponse("Success", {
    comments: comments,
    count: totalPostCommentCount,
  });

  return {
    statusCode: StatusCodes.OK,
    body: JSON.stringify(response),
  };
};

export const getHotCommunityPost = async (event) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  console.log("dateNow", thirtyDaysAgo);

  const topPosts = await mongoose.model("CommunityPost").aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $addFields: {
        commentCount: { $size: "$comments" },
      },
    },
    {
      $match: {
        commentCount: { $gte: 1 },
      },
    },
    {
      $sort: { commentCount: -1 },
    },
    {
      $limit: 3,
    },
    {
      $project: {
        _id: 0,
        commentCount: -1,
        title: 1,
        description: 1,
      },
    },
  ]);
  console.log("result=>", topPosts);
  const response = new HTTPResponse("Success", topPosts);
  return {
    statusCode: StatusCodes.OK,
    body: JSON.stringify(response),
  };
};

