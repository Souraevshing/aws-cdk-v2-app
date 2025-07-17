import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { faker } from "@faker-js/faker";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient({});
const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  //fetch the http method
  const method = e.requestContext.http.method;

  //get the path entered the url to trigger any type of http method
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
  const result = await dynamoDBClient.send(
    new ScanCommand({ TableName: TABLE_NAME, Select: "ALL_ATTRIBUTES" })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ data: result.Items || [] }),
  };
}

// create new user
async function createUser(
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { name, email }: { name: string; email: string } = JSON.parse(e.body!);
  const user = {
    id: uuidv4(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: new Date().toISOString(),
  };

  await dynamoDBClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify({ data: user }),
  };
}

// get user by id
async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDBClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id: userId } })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data: result.Item }),
  };
}

// update user by id
async function updateUser(
  e: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const { name, email } = JSON.parse(e.body!);

  const result = await dynamoDBClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
      UpdateExpression: "SET #name = :name, #email = :email",
      ExpressionAttributeNames: {
        "#name": "name",
        "#email": "email",
      },
      ExpressionAttributeValues: {
        ":name": name || null,
        ":email": email || null,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ data: result.Attributes }),
  };
}

// delete user by id
async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  await dynamoDBClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `User ${userId} deleted` }),
  };
}
