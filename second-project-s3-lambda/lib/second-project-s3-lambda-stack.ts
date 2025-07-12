import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apiGatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { SecretsManagerStack } from "./secrets-environment-variable-stack";

export class SecondProjectS3LambdaStack extends cdk.Stack {
  private readonly secretsStack: SecretsManagerStack;

  // add check to add value for StackProps or add SecretsManagerStack as props if passed to argument
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps & { secretsStack: SecretsManagerStack }
  ) {
    super(scope, id, props);
    this.secretsStack = props?.secretsStack!;

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

    // lambda for fetching `/` home route
    const homeLambda = new NodejsFunction(this, "homeLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "home",
      functionName: `${this.stackName}-HomeRouteLambdaStack`,
    });

    // lambda for sending POST request to `/create` route
    const createProfile = new NodejsFunction(this, "createProfile", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "createProfile",
      functionName: `${this.stackName}-CreateProfileLambdaStack`,
    });

    // lambda to test and access environment variable
    const testEnvironmentVariable = new NodejsFunction(
      this,
      "testEnvironmentVariable",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/lambda/handler.ts"),
        handler: "testEnvironmentVariable",
        functionName: `${this.stackName}-TestEnvironmentVariable`,
        environment: {
          USER: "codey", // used to check if this env variable is same in lambda function
        },
      }
    );

    // lambda to fetch secret key
    const fetchSecret = new NodejsFunction(this, "fetchSecret", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "fetchSecret",
      functionName: `${this.stackName}-FetchSecret`,
    });

    // get the environment value with the key `SECRET_ID` and value from SecretsManagerStack
    fetchSecret.addEnvironment(
      "SECRET_ID",
      this.secretsStack.secrets.secretName
    );

    // add policy to allow read access from iam root user
    // pass actions array containing the list of actions to add to the statement to fetch relevant
    fetchSecret.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ],
        resources: [this.secretsStack.secrets.secretArn],
      })
    );

    // this is also another approach to set env variable
    // testEnvironmentVariable.addEnvironment("USER","codey")

    // create http api to test REST apis
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

    // TestEnvironmentVariable / route
    // GET /test
    http.addRoutes({
      path: "/test",
      methods: [apiGateway.HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "TestEnvironmentVariableIntegration",
        testEnvironmentVariable
      ),
    });

    // create POST route
    // POST /profile
    http.addRoutes({
      path: "/profile",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "ProfileRouteIntegration",
        createProfile
      ),
    });

    // POST /secret
    http.addRoutes({
      path: "/secret",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "SecretIntegration",
        fetchSecret
      ),
    });

    // send output to aws
    new cdk.CfnOutput(this, "HttpUrl", {
      value: http.url!,
      description: "Http API Url",
    });
  }
}
