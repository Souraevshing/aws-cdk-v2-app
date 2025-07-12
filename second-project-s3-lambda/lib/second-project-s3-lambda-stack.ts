import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apiGatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class SecondProjectS3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // simple example showcasing lambda createConnection, logging, testing and deploying
    const exampleLambda = new NodejsFunction(this, "exampleLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "lambdaExample1",
      functionName: `${this.stackName}-ExampleLambdaStack`,
    });

    // send output to aws console
    new cdk.CfnOutput(this, "lambdaExample1Output", {
      value: exampleLambda.functionArn,
      description: "ARN of lambdaExample1",
    });

    const homeLambda = new NodejsFunction(this, "homeLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "home",
      functionName: `${this.stackName}-HomeRouteLambdaStack`,
    });

    const createProfile = new NodejsFunction(this, "createProfile", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "createProfile",
      functionName: `${this.stackName}-CreateProfileLambdaStack`,
    });

    // allow all origin
    const http = new apiGateway.HttpApi(this, "firstHttpApi", {
      apiName: "First Http API",
      description: "First Http API with CDK",
      corsPreflight: {
        allowOrigins: ["http://localhost:3000"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
        allowHeaders: ["*"],
      },
    });

    // GET / route
    http.addRoutes({
      path: "/",
      methods: [apiGateway.HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "HomeRouteIntegration",
        homeLambda
      ),
    });

    // create POST route
    http.addRoutes({
      path: "/profile",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "ProfileRouteIntegration",
        createProfile
      ),
    });

    new cdk.CfnOutput(this, "HttpUrl", {
      value: http.url!,
      description: "Http API Url",
    });
  }
}
