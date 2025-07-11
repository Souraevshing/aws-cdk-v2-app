import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class SecondProjectS3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaExample = new NodejsFunction(this, "lambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "lambdaExample1",
      functionName: "SecondProjectS3LambdaStack",
    });
    new cdk.CfnOutput(this, "lambdaExample1Output", {
      value: lambdaExample.functionArn,
      description: "ARN of lambdaExample1",
    });
  }
}
