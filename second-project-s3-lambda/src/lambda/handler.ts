import { APIGatewayProxyEventV2 } from "aws-lambda";
import crypto from "crypto";

import { fetchSecretKey } from "../utils/fetch-secret-key";

export const lambdaExample1 = async (e: any) => {
  console.log("Hi from function lambda");
  return {
    status: 200,
    message: "Hello from function lambda",
  };
};

// home route
// GET / request
export const home = async (e: APIGatewayProxyEventV2) => {
  console.log("Hello from home route", e);

  return {
    status: 200,
    body: JSON.stringify({
      message: "Hello from home route",
    }),
  };
};

export const createProfile = async (e: APIGatewayProxyEventV2) => {
  console.log(`Hello from POST create route`);
  console.log(`Event: ${e}`);
  const body = JSON.parse(e.body!);
  return {
    status: 201,
    body: JSON.stringify({
      message: "Profile created successfully",
      user: body.user,
    }),
  };
};

export const testEnvironmentVariable = async (e: APIGatewayProxyEventV2) => {
  const user = process.env.USER;
  const message = `${user ? `Welcome ${user}!` : `No user found`}`;
  return {
    status: 200,
    body: JSON.stringify({ message }),
  };
};

export const fetchSecret = async (e: APIGatewayProxyEventV2) => {
  try {
    const { user } = JSON.parse(e.body ?? "{}");
    const secretValue = await fetchSecretKey(process.env.SECRET_ID!);
    const { encryptionKey } = JSON.parse(secretValue);
    const hashedUsername = crypto
      .createHmac("sha256", encryptionKey)
      .update(user)
      .digest("hex");

    if (!secretValue || !encryptionKey) {
      return {
        status: 500,
        body: JSON.stringify({
          message: "Secret or encryption key does not exist",
        }),
      };
    }

    if (!user) {
      return {
        status: 500,
        body: JSON.stringify({ message: "User is required in request body" }),
      };
    }

    return {
      status: 200,
      body: JSON.stringify({ user: hashedUsername }),
    };
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      return {
        status: 500,
        body: JSON.stringify({ message: e.message }),
      };
    } else {
      console.error("Unknown error", e);
      return {
        status: 500,
        body: JSON.stringify({ message: "An unknown error occurred" }),
      };
    }
  }
};
