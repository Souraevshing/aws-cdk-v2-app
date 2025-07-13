# Project 2 - Lambda + API Gateway (v2) + Secrets Manager Stack

**AWS Lambda** is a serverless computing service that lets you run code without managing servers. You simply upload your code and AWS handles the infrastructure, automatically scaling up or down based on demand. Lambda functions are triggered by events like HTTP requests, file uploads, or database changes, making them perfect for building responsive applications that only pay for the compute time they actually use.

**Cost**: You pay only for the compute time you use, measured in 100ms increments. The first 1 million requests per month are free, then $0.20 per 1 million requests. Compute time costs $0.0000166667 per GB-second, meaning a 128MB function running for 1 second costs about $0.000002. This makes Lambda extremely cost-effective for applications with variable or low traffic.

**API Gateway** is a fully managed service that makes it easy to create, publish, and manage APIs at any scale. It acts as a front door for your applications, handling incoming HTTP requests and routing them to the appropriate backend services like Lambda functions. API Gateway handles common tasks like authentication, rate limiting, and CORS (Cross-Origin Resource Sharing), so you can focus on building your application logic instead of managing API infrastructure.

**Cost**: HTTP APIs (v2) cost $1.00 per million API calls, with the first 300 million requests per month free. REST APIs (v1) cost $3.50 per million calls. You also pay for data transfer out at $0.09 per GB. For most applications, HTTP APIs are significantly cheaper than REST APIs while providing the same core functionality.

**Secrets Manager** is a service that helps you protect sensitive information like database passwords, API keys, and other credentials. Instead of hardcoding secrets in your application code (which is a security risk), Secrets Manager securely stores them and provides a simple way to retrieve them when needed. It automatically rotates credentials on a schedule, reducing the risk of security breaches and ensuring your applications always use up-to-date credentials.

**Cost**: You pay $0.40 per secret per month, plus $0.05 per 10,000 API calls. The first 10,000 API calls per month are free. For applications with many secrets or high API call volumes, costs can add up quickly, so it's important to consider whether you need automatic rotation or if a simpler solution like Systems Manager Parameter Store (which is free) might suffice.

## Create a Project

On the desktop, create the project `lambda`, open it, and run `npx cdk init`. Pick "app" and run the command.

## Create First Lambda - Logic

- create `src/lambda/handler.ts`

```ts
export const lambdaExample = async (event: any) => {
  console.log('TEMP Event log', event);
  return {
    message: 'Hello World',
  };
};
```

1. Handler Function

- **Must be exported**: `export const lambdaExample` - AWS Lambda needs to access this function
- **Function name**: Can be any valid identifier, but should be descriptive
- **Async handler recommended**: For Node.js Lambdas, it's recommended to use an `async` handler (or return a Promise) to ensure the return value is properly handled by the Lambda runtime and tools like the Lambda console. Synchronous handlers may result in `null` responses in some cases.
- **Event parameter**: Required - Lambda always receives an event object containing trigger data

2. Event Parameter

- **Purpose**: Contains all data from the trigger source (API Gateway, S3, DynamoDB, etc.)
- **Structure**: Varies based on trigger type (API Gateway events have different structure than S3 events)
- **Type**: `any` is acceptable but not ideal for production

3. Response Format

- **Must return**: A JSON-serializable object
- **API Gateway integration**: Response should include status code and headers if needed
- **Error handling**: Should handle exceptions and return appropriate error responses

4. Logging

- **`console.log()`**: Automatically goes to CloudWatch logs
- **Best practice**: Log important events for debugging and monitoring
- **Security**: Be careful not to log sensitive data

## Create First Lambda - Stack

`stack`

```ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

const exampleLambda = new NodejsFunction(this, 'ExampleHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'lambdaExample',
  functionName: 'cdk-course-example-lambda',
});
new cdk.CfnOutput(this, 'ExampleLambdaArn', {
  value: exampleLambda.functionArn,
  description: 'The ARN of the example lambda function',
});
```

## Code Explanation

This code creates an AWS Lambda function using AWS CDK with the `NodejsFunction` construct:

- **`NodejsFunction`**: Specialized construct for Node.js Lambda functions that automatically bundles TypeScript/JavaScript code
- **`runtime: lambda.Runtime.NODEJS_22_X`**: Specifies Node.js 22.x runtime environment
- **`entry: path.join(__dirname, '../src/handler.ts')`**: Points to the TypeScript source file
- **`handler: 'lambdaExample'`**: References the exported function name from the handler file
- **`functionName: 'cdk-course-example-lambda'`**: Sets a custom name for the Lambda function
- **`CfnOutput`**: Creates a CloudFormation output to display the Lambda ARN after deployment
- **ARN (Amazon Resource Name)**: Unique identifier for AWS resources - format: `arn:aws:lambda:region:account:function:name` - used for IAM permissions, cross-service references, and resource identification
- **esbuild requirement**: `NodejsFunction` uses esbuild to bundle TypeScript code into JavaScript - without esbuild installed, the bundling process will fail during deployment because CDK cannot compile TypeScript files into the JavaScript that Lambda runtime expects

## Multiple Ways to Create Lambda in CDK

- **`NodejsFunction`**: Best for TypeScript/JavaScript - auto-bundles code, handles dependencies
- **`lambda.Function`**: Basic construct for any runtime - requires manual bundling
- **`lambda.DockerImageFunction`**: Uses Docker containers for custom runtimes
- **`lambda.SingletonFunction`**: Ensures only one instance exists across deployments
- **`lambda.Version`**: Creates versioned Lambda functions for blue/green deployments

## esbuild

- try running `npx cdk synth`, if everything is correct you will get an error.
- run `npm i esbuild`

## Deploy the stack

- run `npx cdk deploy`

## AWS Lambda GUI

### Test Event

### Automatic CloudWatch Log Group

A Log Group is a logical container in AWS CloudWatch that holds related log streams. Think of it as a folder that organizes logs from the same source or application. Each Log Group can contain multiple Log Streams, which are the actual sequences of log events. Log Streams are the individual log files within a Log Group - each Lambda function invocation creates a new Log Stream, and all the console.log statements, errors, and execution details from that specific invocation are written to that stream. This allows you to trace the complete execution of a single Lambda function call from start to finish. For Lambda functions, AWS automatically creates one Log Group per function, and each function execution creates a new Log Stream within that Log Group. This hierarchical structure allows you to easily filter, search, and analyze logs from specific functions while maintaining organization across your entire application's logging infrastructure. Every AWS Lambda function automatically creates a CloudWatch Log Group with the naming convention `/aws/lambda/{function-name}`. This log group captures all console output, errors, and execution details from your Lambda function. When you use `console.log()` in your handler, the messages are automatically sent to this log group, providing real-time visibility into function execution, debugging capabilities, and performance monitoring. The log group retains logs based on your retention settings and can be configured to automatically expire old log entries to manage storage costs.

## API Gateway Intro

## Home Route Lambda

- run `npm install --save-dev @types/aws-lambda`

`handler.ts`

```ts
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export const lambdaExample = async (event: any) => {
  console.log('TEMP Event log', event);
  return {
    message: 'Hello World',
  };
};

export const homeRoute = async (event: APIGatewayProxyEventV2) => {
  console.log('Home Route Event log', event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to the API!',
    }),
  };
};
```

## Create API Gateway

`stack`

```ts
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigateway_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

const homeLambda = new NodejsFunction(this, 'HomeHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'homeRoute',
  functionName: `${this.stackName}-home-route-lambda`,
});
// Create HTTP API (API Gateway v2)
const httpApi = new apigateway.HttpApi(this, 'FirstApi', {
  apiName: 'First Api',
  description: 'First Api with CDK',
});

// Create routes
httpApi.addRoutes({
  path: '/',
  methods: [apigateway.HttpMethod.GET],
  integration: new apigateway_integrations.HttpLambdaIntegration('HomeIntegration', homeLambda),
});

new cdk.CfnOutput(this, 'HttpApiUrl', {
  value: httpApi.url ?? '',
  description: 'HTTP API URL',
});
```

This code creates an HTTP API using API Gateway v2 and connects it to a Lambda function:

- An HTTP API resource is created with a specified name and description, serving as the entry point for your RESTful API.
- A route is added for the root path ("/") that listens for HTTP GET requests. This route is integrated with a Lambda function, so whenever a GET request is made to the root path, API Gateway invokes the Lambda.
- The integration uses a construct that connects the API Gateway route directly to the Lambda function, allowing the Lambda to process incoming HTTP requests and return responses.
- After deployment, the URL of the HTTP API is output, making it easy to find and test your new API endpoint.

## POST Route

`handler.ts`

```ts
export const createProfileRoute = async (event: APIGatewayProxyEventV2) => {
  console.log('event : ', event);
  const body = JSON.parse(event.body ?? '{}');

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'Profile created successfully',
      username: body.username,
    }),
  };
};
```

`stack.ts`

```ts
const createProfileLambda = new NodejsFunction(this, 'ProfileHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'createProfileRoute',
  functionName: `${this.stackName}-profile-lambda`,
});

httpApi.addRoutes({
  path: '/profile',
  methods: [apigateway.HttpMethod.POST],
  integration: new apigateway_integrations.HttpLambdaIntegration('ProfileIntegration', createProfileLambda),
});
```

## REST Client Extension

[Docs](https://open-vsx.org/extension/humao/rest-client)

- install extension
- create file `makeRequests.http`

```ts
@URL = your url

### Get Home Route
GET {{URL}}

### Create Profile
POST {{URL}}/profile
Content-Type: application/json

{
    "username": "John Doe"
}
```

## CORS Error

- navigate to the the front-end app (course repo)
- spin up the app `npm install && npm run dev`
- if everything is correct, you will hit the error

`stack.ts`

```ts
const httpApi = new apigateway.HttpApi(this, 'FirstApi', {
  apiName: 'First Api',
  description: 'First Api with CDK',
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [apigateway.CorsHttpMethod.ANY],
    allowHeaders: ['*'],
  },
});
```

## ENV Variables

`handler.ts`

```ts
export const welcomeRoute = async (event: APIGatewayProxyEventV2) => {
  const username = process.env.USERNAME;
  const message = username ? `Welcome ${username}!` : 'Welcome to the API!';

  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
    }),
  };
};
```

`stack`

```ts
const welcomeLambda = new NodejsFunction(this, 'WelcomeHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'welcomeRoute',
  functionName: `${this.stackName}-welcome-route-lambda`,
});

httpApi.addRoutes({
  path: '/welcome',
  methods: [apigateway.HttpMethod.GET],
  integration: new apigateway_integrations.HttpLambdaIntegration('WelcomeIntegration', welcomeLambda),
});
```

`makeRequests.http`

```ts
### Get Welcome Route
GET {{URL}}/welcome
```

- add ENV Variable in AWS Lambda GUI (useful for testing)

## ENV Variables in CDK

```ts
const welcomeLambda = new NodejsFunction(this, 'WelcomeHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'welcomeRoute',
  functionName: `${this.stackName}-welcome-route-lambda`,
  environment: {
    USERNAME: 'ShakeAndBake',
  },
});
// welcomeLambda.addEnvironment('USERNAME', 'ShakeAndBake');
```

## Secrets Manager

- create lib/secrets-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class SecretsStack extends cdk.Stack {
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.secret = new secretsmanager.Secret(this, 'MyAppSecret', {
      secretName: 'my-app-secret',
      secretObjectValue: {},
    });

    this.secret.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    // Output the secret ARN
    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.secret.secretArn,
      description: 'The ARN of the secret',
      exportName: 'SecretArn',
    });
  }
}
```

- update bin/lambda.ts

```ts

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaDevStack } from '../lib/lambda-dev-stack';
import { SecretsStack } from '../lib/secrets-stack';

const app = new cdk.App();
const secretsStack = new SecretsStack(app, 'SecretsStack');

const lambdaStack = new LambdaDevStack(app, 'LambdaDevStack', {
  secretsStack,
});

lambdaStack.addDependency(secretsStack);

```

This line `lambdaStack.addDependency(secretsStack);` is crucial for **deployment order and resource dependencies** in AWS CDK. It enforces that the `lambdaStack` must be deployed **after** the `secretsStack`, creating a dependency relationship where CDK ensures secrets are created before any Lambda functions that might need them. This is necessary because if your Lambda functions reference secrets from the `secretsStack` (like database credentials or API keys), those secrets must exist before the Lambda functions are created. Without this dependency, CDK might try to deploy the Lambda stack first, which could fail if it references resources that don't exist yet. While you could manually deploy stacks in the correct order or combine both stacks into one, using `addDependency()` is the cleanest way to manage cross-stack dependencies in CDK and is a fundamental pattern for managing complex infrastructure with multiple stacks that depend on each other.

`stack.ts`

```ts
import { SecretsStack } from './secrets-stack';

export class LambdaDevStack extends cdk.Stack {
  private readonly secretsStack: SecretsStack;

  constructor(scope: Construct, id: string, props: cdk.StackProps & { secretsStack: SecretsStack }) {
    super(scope, id, props);
    this.secretsStack = props.secretsStack;
  }
}
```

Since we have multiple stacks now we need to specify which stack we want to deploy or deploy them all

```sh
npx cdk deploy SecretsStack
```

```sh
npx cdk deploy --all
```

## AWS Secrets Manager

- add `SECRET_ID` with value `secret_value`
- create another secret (manually in the console) and use plain text option

## Fetch Secret

- run `npm i @aws-sdk/client-secrets-manager`

- create `src/utils/fetchSecret.ts`

```ts
import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({});

export const fetchSecret = async (secretId: string): Promise<string> => {
  const command = new GetSecretValueCommand({
    SecretId: secretId,
  });

  let response: GetSecretValueCommandOutput;
  try {
    response = await secretsClient.send(command);
  } catch (error) {
    throw new Error('Failed to fetch secret');
  }

  if (!response.SecretString) {
    throw new Error('Secret value is undefined');
  }

  return response.SecretString;
};
```

`src/lambda/handler.ts`

```ts
import { fetchSecret } from '../utils/fetchSecret';
import crypto from 'crypto';

export const loginRoute = async (event: APIGatewayProxyEventV2) => {
  try {
    const { username } = JSON.parse(event.body ?? '{}');
    // can also pass secret name directly
    const secretValue = await fetchSecret(process.env.SECRET_ID!);
    const { encryptionKey } = JSON.parse(secretValue);
    const hashedUsername = crypto.createHmac('sha256', encryptionKey).update(username).digest('hex');

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: hashedUsername,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong',
      }),
    };
  }
};
```

`stack`

```ts
import * as iam from 'aws-cdk-lib/aws-iam';

const loginLambda = new NodejsFunction(this, 'LoginHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(__dirname, '../src/lambda/handler.ts'),
  handler: 'loginRoute',
  functionName: `${this.stackName}-login-route-lambda`,
});
loginLambda.addEnvironment('SECRET_ID', this.secretsStack.secret.secretName);

loginLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: [this.secretsStack.secret.secretArn],
  })
);
httpApi.addRoutes({
  path: '/login',
  methods: [apigateway.HttpMethod.POST],
  integration: new apigateway_integrations.HttpLambdaIntegration('LoginIntegration', loginLambda),
});
```

```sh
npx cdk deploy --all
```

```ts
### Login Route
POST {{URL}}/login
Content-Type: application/json

{
    "username": "John Doe"
}
```

```sh
npx cdk destroy --all
```

# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `npx cdk deploy`  deploy this stack to your default AWS account/region
- `npx cdk diff`    compare deployed stack with current state
- `npx cdk synth`   emits the synthesized CloudFormation template
