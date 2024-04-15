import { StatusCodes } from "http-status-codes";
import { DBConn, HTTPResponse, catchTryAsyncErrors } from "./helper.mjs";
import { ObjectId } from "mongodb";

var userId = "65d58c02ff92538d09c4b81a";

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const queryParams = event.queryStringParameters || {};
    const body = JSON.parse(event.body || "{}");

    const client = await DBConn();
    const DB = client.db("10DServerless");

    switch (httpMethod) {
      case "POST":
        if (path === "/addCommunityPost") {
          return catchTryAsyncErrors(addCommunityPost)(body, DB);
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
      body: JSON.stringify({
        message: "Something went wrong",
        error: error.message,
      }),
    };
  }
};

export const addCommunityPost = async (body, DB) => {
  const user = new ObjectId(userId);
  const postToAdd = { ...body, user };

  const postsCollection = DB.collection("communityposts");
  await postsCollection.insertOne(postToAdd);

  const response = new HTTPResponse(
    "Community Post created successfully!",
    postToAdd
  );

  return {
    statusCode: StatusCodes.CREATED,
    body: JSON.stringify(response),
  };
};
