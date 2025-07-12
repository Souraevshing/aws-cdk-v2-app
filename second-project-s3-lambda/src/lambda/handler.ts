import { APIGatewayProxyEventV2 } from "aws-lambda";

export const lambdaExample1 = async (e: any) => {
  console.log("Hi from function lambda");
  return {
    status: 200,
    message: "Hello from function lambda",
  };
};

//home route
export const home = async (e: APIGatewayProxyEventV2) => {
  console.log("Hello from home route", e);

  return {
    status: 200,
    body: JSON.stringify({
      message: "Hello from home route",
    }),
  };
};
