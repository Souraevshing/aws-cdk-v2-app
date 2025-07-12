import { APIGatewayProxyEventV2 } from "aws-lambda";

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
