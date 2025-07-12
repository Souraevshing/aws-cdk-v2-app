#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { SecondProjectS3LambdaStack } from "../lib/second-project-s3-lambda-stack";
import { SecretsManagerStack } from "../lib/secrets-environment-variable-stack";

// create or initialize cdk app
const app = new cdk.App();

// create instance for SecretsManagerStack

// it is used for using the secrets from SecretsManagerStack
const secretsStack = new SecretsManagerStack(app, "SecretsManagerStack");

// create a root lambdaStack for SecondProjectS3LambdaStack that is the main file which is executed by default.

// and as an argument passing secretsStack that is a reference to SecretsManagerStack
const lambdaStack = new SecondProjectS3LambdaStack(
  app,
  "SecondProjectS3LambdaStack",
  { secretsStack }
);

lambdaStack.addDependency(secretsStack);

/**
 * In order to run this app that is having 2 stacks i.e. Since this app includes more than a single stack, specify which stacks to use (wildcards are supported) or specify `--all`
Stacks: SecretsManagerStack · SecondProjectS3LambdaStack
 */
`npx cdk deploy --all`;
