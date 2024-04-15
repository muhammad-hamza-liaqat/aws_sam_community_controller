import { StatusCodes } from "http-status-codes";
import {
  DBConn,
  HTTPError,
  HTTPResponse,
  catchTryAsyncErrors,
} from "./helper.mjs";
import { ObjectId } from "mongodb";

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const queryParams = event.queryStringParameters || {};
    const body = JSON.parse(event.body || "{}");

    const client = await DBConn();
    const DB = client.db("10D");

    switch (method) {
      case "GET":
        if (path === "/addCommunityPost") {
          return catchTryAsyncErrors(addCommunityPost)(queryParams, DB);
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
      body: JSON.stringify({ message: "Something Went Wrong", error: error }),
    };
  }
};

export const addCommunityPost = async (req, res) => {
  let postToAdd = new CommunityPost({
    ...req.body,
    user: new mongoose.Types.ObjectId(userId),
  });
  await postToAdd.save();
  let response = new HTTPResponse(
    "Community Post created successfully!",
    postToAdd
  );
  console.log("post added to db:", postToAdd);
  return res.status(StatusCodes.CREATED).json(response);
};
