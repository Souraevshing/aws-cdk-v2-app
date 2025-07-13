import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export const handler = async (
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  //fetch the http method
  const method = e.requestContext.http.method;

  //get the path entered in the url to trigger any type of http method
  const path = e.requestContext.http.path;

  try {
    if (path === "/users") {
      switch (method) {
        case "GET":
          return getAllUsers(e);
        case "POST":
          return createUser(e);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Path not found" }),
          };
      }
    }

    if (path.startsWith("/users")) {
      const userId = path.split("/users/")[1];
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User id not found" }),
        };
      }
      switch (method) {
        case "GET":
          return getUser(userId);
        case "PUT":
          return updateUser(e, userId);
        case "DELETE":
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Path not found" }),
          };
      }
    }
  } catch (error) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Invalid request" }),
  };
};

// get all users
async function getAllUsers(
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Get all Users` }),
  };
}

// create new user
async function createUser(
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 201,
    body: JSON.stringify({ message: "User created" }),
  };
}

// get user by id
async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `User ${userId}  fetched` }),
  };
}

// update user by id
async function updateUser(
  e: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `User ${userId} updated` }),
  };
}

// delete user by id
async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `User ${userId} deleted` }),
  };
}
