#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { AwsUsersApiStack } from "../lib/aws-users-api-stack";
import { DynamoDBStack } from "../lib/dynamo-db-stack";

const app = new cdk.App();
const dynamoDBStack = new DynamoDBStack(app, "DynamoDBStack");

new AwsUsersApiStack(app, "AwsUsersApiStack", { dynamoDBStack });
