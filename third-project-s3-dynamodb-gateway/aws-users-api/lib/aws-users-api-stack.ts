import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apiGatewayIntegration from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";

import { DynamoDBStack } from "./dynamo-db-stack";

interface AwsUsersApiStackProps extends cdk.StackProps {
  dynamoDBStack: DynamoDBStack;
}

export class AwsUsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsUsersApiStackProps) {
    super(scope, id, props);
    const userHandler = new NodejsFunction(this, "UserHandler", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "handler",
      functionName: `${this.stackName}-user-handler`,
      environment: {
        TABLE_NAME: props.dynamoDBStack.userTable.tableName,
      },
    });

    // grant read/write access to user table
    props.dynamoDBStack.userTable.grantReadWriteData(userHandler);

    const http = new apiGateway.HttpApi(this, "UsersAPI", {
      apiName: "Users api",
      description: "CRUD operations for user",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
        allowHeaders: ["*"],
      },
    });

    // routes for calling HttpMethods and perform operations
    const routes = [
      {
        path: "/users",
        method: apiGateway.HttpMethod.GET,
        name: "GetAllUsers",
      },
      {
        path: "/users",
        method: apiGateway.HttpMethod.POST,
        name: "CreateUser",
      },
      {
        path: "/users/{id}",
        method: apiGateway.HttpMethod.GET,
        name: "GetUser",
      },
      {
        path: "/users/{id}",
        method: apiGateway.HttpMethod.PUT,
        name: "DeleteUser",
      },
      {
        path: "/users/{id}",
        method: apiGateway.HttpMethod.DELETE,
        name: "DeleteUser",
      },
    ];

    routes.forEach(({ name, path, method }) => {
      http.addRoutes({
        path,
        methods: [method],
        integration: new apiGatewayIntegration.HttpLambdaIntegration(
          `${name}-integration`,
          userHandler
        ),
      });
    });

    new cdk.CfnOutput(this, "HttpAPIUrl", {
      value: http.url!,
      description: "Http Restful apis for user",
    });
  }
}
