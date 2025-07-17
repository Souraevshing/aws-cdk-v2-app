# 3. Project 3 : Users API - DynamoDB + API Gateway + Lambda Stack

## DynamoDB Overview

Amazon DynamoDB is a fully managed NoSQL database service provided by AWS that offers seamless scalability and high performance for applications requiring consistent, single-digit millisecond latency at any scale. It's designed to handle massive workloads and automatically scales up or down based on your application's needs without requiring manual intervention. DynamoDB supports both document and key-value data models, making it versatile for various use cases from gaming and mobile applications to IoT and web applications. The service provides built-in security, backup and restore capabilities, and in-memory caching with DynamoDB Accelerator (DAX) for microsecond performance.

**Cost Structure**

DynamoDB pricing is based on two primary models: **On-Demand** and **Provisioned** capacity. With **On-Demand** pricing, you pay only for the data you read and write, with no capacity planning required - costs are $1.25 per million write request units and $0.25 per million read request units. **Provisioned** capacity requires you to specify read and write capacity units in advance, with costs of $0.00065 per write capacity unit-hour and $0.00013 per read capacity unit-hour. Storage costs $0.25 per GB-month for the first 25TB, with additional storage tiers offering reduced rates. DynamoDB also charges for data transfer out of AWS regions ($0.09 per GB for the first 10TB), backup storage ($0.10 per GB-month for continuous backups), and point-in-time recovery ($0.20 per GB-month). The service includes 25GB of storage and 25 write/read capacity units free tier per month for the first 12 months, making it cost-effective for development and small applications.

## Create a Project

- On the desktop, create the project `users-api`, open it, and run `npx cdk init`. Pick "app" and run the command.
- run `npm i esbuild @faker-js/faker uuid @types/uuid @types/aws-lambda @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`

### Library Explanations

- **@faker-js/faker**: Generates realistic fake data for testing and development purposes, including names, addresses, emails, and other user information. It's essential for creating mock data to populate our users API with sample records.

- **uuid**: Creates universally unique identifiers (UUIDs) that are guaranteed to be unique across distributed systems. It's used to generate unique IDs for each user record in our DynamoDB database.

- **@types/uuid**: Provides TypeScript type definitions for the uuid library, enabling better IntelliSense and type checking when working with UUIDs in TypeScript code.

- **@types/aws-lambda**: Contains TypeScript type definitions for AWS Lambda functions, including event types, context objects, and callback functions. It ensures type safety when developing Lambda functions for our API.

- **@aws-sdk/client-dynamodb**: The core AWS SDK v3 client for DynamoDB that provides low-level access to DynamoDB operations like PutItem, GetItem, Query, and Scan. It handles the direct communication with DynamoDB service.

- **@aws-sdk/lib-dynamodb**: A higher-level library that simplifies DynamoDB operations by automatically handling data marshalling and unmarshalling between JavaScript objects and DynamoDB's AttributeValue format. It makes working with DynamoDB much more developer-friendly by allowing you to work with plain JavaScript objects instead of complex AttributeValue structures.

## API Structure

- create `src/lambda/handler.ts`

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Handle /users path operations
    if (path === '/users') {
      switch (method) {
        case 'GET':
          return getAllUsers(event);
        case 'POST':
          return createUser(event);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for /users path' }),
          };
      }
    }

    // Handle /users/{id} path operations
    if (path.startsWith('/users/')) {
      const userId = path.split('/users/')[1];
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID is required' }),
        };
      }

      switch (method) {
        case 'GET':
          return getUser(userId);
        case 'PUT':
          return updateUser(event, userId);
        case 'DELETE':
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for user operations' }),
          };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function createUser(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // const { name, email } = JSON.parse(event.body as string);

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'create user' }),
  };
}

async function getAllUsers(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'fetch all users' }),
  };
}

async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'fetch single user' }),
  };
}

async function updateUser(event: APIGatewayProxyEventV2, userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'update user' }),
  };
}

async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'delete user' }),
  };
}
```

`stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigateway_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class UsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a single Lambda function for all operations
    const userHandler = new NodejsFunction(this, 'UserHandler', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'handler',
      functionName: `${this.stackName}-user-handler`,
    });

    const httpApi = new apigateway.HttpApi(this, 'UserApi', {
      apiName: 'User API',
      description: 'User Management API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    // Define routes configuration
    const routes = [
      { path: '/users', method: apigateway.HttpMethod.GET, name: 'GetAllUsers' },
      { path: '/users', method: apigateway.HttpMethod.POST, name: 'CreateUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.GET, name: 'GetUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.PUT, name: 'UpdateUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.DELETE, name: 'DeleteUser' },
    ];

    // Add all routes
    routes.forEach(({ path, method, name }) => {
      httpApi.addRoutes({
        path,
        methods: [method],
        integration: new apigateway_integrations.HttpLambdaIntegration(`${name}Integration`, userHandler),
      });
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url ?? '',
      description: 'HTTP API URL',
    });
  }
}
```

- run `npx cdk deploy`

- create `makeRequests.http`

```ts


@URL = https://5g5nfth0pf.execute-api.eu-north-1.amazonaws.com/


### Get all users
GET {{URL}}/users

### Create a user
POST {{URL}}/users
Content-Type: application/json

{
    "name": "coding addict"
}

### Get a user
GET {{URL}}/users/1

### Update a user
PUT {{URL}}/users/1
Content-Type: application/json

{
    "name": "coding addict",
    "email": "coding@addict.com"
}

### Delete a user
DELETE {{URL}}/users/1

```

## DynamoDB

- create `lib/dynamodb-stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DynamoDBStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: `${this.stackName}-users-table`,
    });
  }
}
```

- **`partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }`**: Defines the primary key for the table where `id` is the partition key field and it stores string values. This is the main identifier for each user record and determines how data is distributed across DynamoDB's partitions.

**Primary Key**: A unique identifier that ensures no two items in the table can have the same value.

- **`billingMode: dynamodb.BillingMode.PAY_PER_REQUEST`**: Sets the table to use on-demand billing, meaning you only pay for the actual read/write operations performed rather than provisioning capacity in advance. This is cost-effective for variable workloads.

- **`removalPolicy: cdk.RemovalPolicy.DESTROY`**: Specifies that when the CDK stack is destroyed, the DynamoDB table should be completely deleted along with all its data. This is useful for development environments but should be used cautiously in production.

- **`tableName: \`${this.stackName}-users-table\``**: Creates a unique table name by combining the stack name with "users-table", ensuring the table has a predictable and unique identifier across different deployments.

A **partition** in DynamoDB is like a storage container that holds multiple user records. Think of it as a filing cabinet drawer where you store related files. DynamoDB uses a hash function on your partition key to decide which "drawer" (partition) should store each user. Using `id` as the partition key makes perfect sense because: 1) Each user has a unique ID, so data gets distributed evenly across partitions, 2) Most API operations are "get user by ID" or "update user by ID", which become lightning-fast since DynamoDB knows exactly which partition to look in, and 3) It's simple and predictable - no complex query patterns needed. When you query for a specific user ID, DynamoDB instantly knows which partition contains that user and retrieves it in milliseconds.

`bin/user-api.ts`

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { UsersApiStack } from '../lib/users-api-stack';

const app = new cdk.App();

// Create DynamoDB stack
const dynamodbStack = new DynamoDBStack(app, 'DynamoDBStack');

// Create Lambda stack with table name
const userApiStack = new UsersApiStack(app, 'UsersApiStack', { dynamodbStack });

userApiStack.addDependency(dynamodbStack);
```

`stack.ts`

```ts
import { DynamoDBStack } from './dynamodb-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface UsersApiStackProps extends cdk.StackProps {
  dynamodbStack: DynamoDBStack;
}

export class UsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UsersApiStackProps) {
    super(scope, id, props);

    // Create a single Lambda function for all operations
    const userHandler = new NodejsFunction(this, 'UserHandler', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'handler',
      functionName: `${this.stackName}-user-handler`,
      environment: {
        TABLE_NAME: props.dynamodbStack.usersTable.tableName,
      },
    });

    // Grant the Lambda function access to the DynamoDB table
    props.dynamodbStack.usersTable.grantReadWriteData(userHandler);
  }
}
```

`handler.ts`

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Handle /users path operations
    if (path === '/users') {
      switch (method) {
        case 'GET':
          return getAllUsers(event);
        case 'POST':
          return createUser(event);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for /users path' }),
          };
      }
    }

    // Handle /users/{id} path operations
    if (path.startsWith('/users/')) {
      const userId = path.split('/users/')[1];
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID is required' }),
        };
      }

      switch (method) {
        case 'GET':
          return getUser(userId);
        case 'PUT':
          return updateUser(event, userId);
        case 'DELETE':
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for user operations' }),
          };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function createUser(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // const { name, email } = JSON.parse(event.body as string);
  const userId = uuidv4();

  const user = {
    id: userId,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: new Date().toISOString(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
}

async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
}

async function getAllUsers(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items || []),
  };
}

async function updateUser(event: APIGatewayProxyEventV2, userId: string): Promise<APIGatewayProxyResultV2> {
  const { name, email } = JSON.parse(event.body!);

  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
      UpdateExpression: 'SET #name = :name, #email = :email',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':name': name || null,
        ':email': email || null,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes),
  };
}

async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'user deleted' }),
  };
}
```

## UpdateCommand Explanation

This code updates a user record in DynamoDB using the `UpdateCommand`. Here's how it works:

### 1. **Command Structure**

```typescript
new UpdateCommand({
  TableName: TABLE_NAME, // Which DynamoDB table to update
  Key: { id: userId }, // Which record to update (primary key)
  UpdateExpression: 'SET #name = :name, #email = :email', // What to change
  ExpressionAttributeNames: {
    // Placeholder names for attributes
    '#name': 'name',
    '#email': 'email',
  },
  ExpressionAttributeValues: {
    // Actual values to set
    ':name': name || null,
    ':email': email || null,
  },
  ReturnValues: 'ALL_NEW', // Return the updated record
});
```

### 2. **Key Components**

- **`TableName`**: Specifies which DynamoDB table to update
- **`Key`**: Identifies the specific record using the primary key (`id`)
- **`UpdateExpression`**: DynamoDB's way of specifying what to change
    - `SET` means "set these values"
    - `#name = :name` means "set the name attribute to the name value"

### 3. **Expression Attributes**

- **`ExpressionAttributeNames`**: Maps placeholders to actual attribute names
    - `#name` → `name`
    - `#email` → `email`
- **`ExpressionAttributeValues`**: Maps placeholders to actual values
    - `:name` → the name from the request body
    - `:email` → the email from the request body

### 4. **Why Use Placeholders?**

This prevents **injection attacks** and handles **reserved words**:

```typescript
// ❌ Bad - vulnerable to injection
UpdateExpression: `SET name = '${name}', email = '${email}'`;

// ✅ Good - safe with placeholders
UpdateExpression: 'SET #name = :name, #email = :email';
```

### 5. **ReturnValues: 'ALL_NEW'**

Returns the complete updated record after the update, so you can confirm what was changed.

### 6. **Null Handling**

```typescript
':name': name || null,
':email': email || null,
```

If no value is provided, it sets the field to `null` instead of leaving it unchanged.

This is a secure, efficient way to update specific fields in a DynamoDB record while preventing injection attacks and handling edge cases properly.

## Front-End App

- explore front-end app
- spin up the local dev instance
- deploy to Netlify
- change 'allowOrigins', don't forget about removing trailing '/'

# Project 4 - Product Management Stack

**Services Used:**

- API Gateway
- Lambda
- DynamoDB
- S3

## Setup

- create folder `product-management`
- inside of it run `cdk init app --language=typescript`
- remove existing git repository `rm -rf .git`
- copy contents of README
- run `npm i esbuild @types/aws-lambda @aws-sdk/client-dynamodb @aws-sdk/client-s3 @aws-sdk/lib-dynamodb @types/uuid uuid`

**Libraries Used:**

- **esbuild**: Fast JavaScript/TypeScript bundler for Lambda deployment
- **@types/aws-lambda**: TypeScript type definitions for AWS Lambda
- **@aws-sdk/client-dynamodb**: AWS SDK for DynamoDB operations
- **@aws-sdk/client-s3**: AWS SDK for S3 operations
- **@aws-sdk/lib-dynamodb**: Utility library for easier DynamoDB operations
- **@types/uuid**: TypeScript type definitions for UUID generation
- **uuid**: Library for generating unique identifiers

## Lambdas

- create `src/lambda/products`
    - `createProduct.ts`
    - `getAllProducts.ts`
    - `deleteProduct.ts`
    - `generateThumbnail.ts` (automatically triggered by S3 events)

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event: ', event);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'create product' }),
  };
};
```

- repeat for all Lambdas

## Stack

`product-management-stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaRuntime from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class ProductManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Create DynamoDB table for products
    const productsTable = new dynamodb.Table(this, `${this.stackName}-Products-Table`, {
      tableName: `${this.stackName}-Products-Table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
    });

    // Create S3 bucket for product images
    const productImagesBucket = new s3.Bucket(this, `${this.stackName}-Product-Images-Bucket`, {
      // needs to be lowercase
      bucketName: `${this.stackName.toLowerCase()}-images`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For development - change to RETAIN for production
    });

    // Create Lambda functions for products
    const createProductLambda = new NodejsFunction(this, `${this.stackName}-create-product-lambda`, {
      runtime: lambdaRuntime.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambda/products/createProduct.ts'),
      functionName: `${this.stackName}-create-product-lambda`,
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        PRODUCT_IMAGES_BUCKET_NAME: productImagesBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
    });

    const getAllProductsLambda = new NodejsFunction(this, `${this.stackName}-get-all-products-lambda`, {
      runtime: lambdaRuntime.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambda/products/getAllProducts.ts'),
      functionName: `${this.stackName}-get-all-products-lambda`,
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
      },
    });

    const deleteProductLambda = new NodejsFunction(this, `${this.stackName}-delete-product-lambda`, {
      runtime: lambdaRuntime.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambda/products/deleteProduct.ts'),
      functionName: `${this.stackName}-delete-product-lambda`,
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        PRODUCT_IMAGES_BUCKET_NAME: productImagesBucket.bucketName,
      },
    });

    // Grant permissions to Lambda functions
    productsTable.grantWriteData(createProductLambda);
    productsTable.grantReadData(getAllProductsLambda);
    productsTable.grantReadWriteData(deleteProductLambda);

    // Grant S3 permissions
    productImagesBucket.grantWrite(createProductLambda);
    productImagesBucket.grantWrite(deleteProductLambda);

    // Create API Gateway V2
    const api = new apigatewayv2.HttpApi(this, `${this.stackName}-Api`, {
      apiName: `${this.stackName}-Api`,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    // Add the products routes
    api.addRoutes({
      path: '/products',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration('CreateProductIntegration', createProductLambda),
    });

    api.addRoutes({
      path: '/products',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration('GetAllProductsIntegration', getAllProductsLambda),
    });

    api.addRoutes({
      path: '/products/{id}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration('DeleteProductIntegration', deleteProductLambda),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url!,
      description: 'API Gateway URL for the products API',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ProductsTableName', {
      value: productsTable.tableName,
      description: 'DynamoDB table name for products',
      exportName: `${this.stackName}-Products-TableName`,
    });

    new cdk.CfnOutput(this, 'ProductImagesBucketName', {
      value: productImagesBucket.bucketName,
      description: 'S3 bucket name for product images',
      exportName: `${this.stackName}-Product-Images-BucketName`,
    });
  }
}
```

### Test API

- create `makeRequests.http`

```ts
@URL = https://k83kjpufqf.execute-api.eu-north-1.amazonaws.com

### Create Product
POST {{URL}}/products
Content-Type: application/json

{
    "name": "Product 1"
}

### Get All Products
GET {{URL}}/products

### Delete Product
DELETE {{URL}}/products/1
```

## Types

- create `src/types.product.ts`

```ts
// Product-related interfaces used across Lambda functions

export type Product = {
  name: string;
  description: string;
  price: number;
  imageData: string; // Base64 encoded image data
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};
```

## Create Product

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Product, ProductRecord } from '../../types/product';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// Environment variables
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const PRODUCT_IMAGES_BUCKET_NAME = process.env.PRODUCT_IMAGES_BUCKET_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse and validate the request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Request body is required',
        }),
      };
    }

    const product: Product = JSON.parse(event.body);

    // Validate required fields
    if (!product.name || !product.description || typeof product.price !== 'number' || !product.imageData) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'All fields are required: name, description, price, and image',
        }),
      };
    }

    // Generate unique ID for the product
    const productId = uuidv4();
    const timestamp = new Date().toISOString();

    // Upload image to S3
    let imageUrl: string;
    try {
      console.log('Starting S3 upload process...');
      console.log('Bucket name:', PRODUCT_IMAGES_BUCKET_NAME);

      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = product.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Determine file extension from base64 data
      const fileExtension = product.imageData.includes('data:image/jpeg') ? 'jpg' : product.imageData.includes('data:image/png') ? 'png' : product.imageData.includes('data:image/gif') ? 'gif' : 'jpg';

      const s3Key = `products/${productId}.${fileExtension}`;

      console.log('S3 upload parameters:', {
        bucket: PRODUCT_IMAGES_BUCKET_NAME,
        key: s3Key,
        contentType: `image/${fileExtension}`,
        bufferSize: imageBuffer.length,
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: PRODUCT_IMAGES_BUCKET_NAME,
          Key: s3Key,
          Body: imageBuffer,
          ContentType: `image/${fileExtension}`,
        })
      );

      imageUrl = `https://${PRODUCT_IMAGES_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

      console.log('Image uploaded to S3 successfully:', imageUrl);
    } catch (s3Error: any) {
      console.error('Error uploading image to S3:', s3Error);
      console.error('S3 Error details:', {
        message: s3Error.message,
        code: s3Error.code,
        statusCode: s3Error.statusCode,
        requestId: s3Error.requestId,
        bucketName: PRODUCT_IMAGES_BUCKET_NAME,
      });
      console.log('S3 Error:', s3Error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to upload image',
          error: s3Error.message,
        }),
      };
    }

    // Create product record for DynamoDB
    const productRecord: ProductRecord = {
      id: productId,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: imageUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Store product in DynamoDB
    try {
      await docClient.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Item: productRecord,
        })
      );

      console.log('Product stored in DynamoDB:', productId);
    } catch (dynamoError) {
      console.error('Error storing product in DynamoDB:', dynamoError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to store product',
        }),
      };
    }

    // Return success response
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Product created successfully',
        product: productRecord,
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
```

## AWS Console Test Event

**Note:** The `body` field contains a JSON string (not a JSON object), so quotes inside must be escaped with `\"`.

Since we only use `event.body` in our Lambda functions, we only need to provide the `body` field in our test event. If your Lambda code accesses other properties like `event.path`, `event.headers`, or `event.httpMethod`, you would need to include those fields in your test event as well.

```json
{
  "body": "{\"name\":\"Test Product\",\"description\":\"This is a test product description\",\"price\":29.99,\"imageData\":\"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=\"}"
}
```

- check logs

## Front-End

- open up front-end folder
- provide your backend api url
- decrease the timeout
- test the benefit of logs

## Get All Products

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ProductRecord } from '../../types/product';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Scan DynamoDB table to get all products
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
      })
    );

    const products: ProductRecord[] = (scanResult.Items as ProductRecord[]) || [];

    // Sort products by creation date (newest first)
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`Retrieved ${products.length} products from DynamoDB`);

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };
  } catch (error) {
    console.error('Error retrieving products:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
```

- test in aws console and front-end

## Fix

```ts
// Add bucket policy for public read access to images only
productImagesBucket.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.AnyPrincipal()],
    actions: ['s3:GetObject'],
    resources: [`${productImagesBucket.bucketArn}/products/*`],
  })
);
```

This is the CDK way to add bucket policies

### 2. **`new iam.PolicyStatement()`**

- Creates a new IAM policy statement
- Defines permissions: who can do what on which resources

### 3. **`effect: iam.Effect.ALLOW`**

- Explicitly allows the specified actions
- Could be `DENY` to block access instead

### 4. **`principals: [new iam.AnyPrincipal()]`**

- `AnyPrincipal()` means "anyone" (public access)
- Makes the bucket publicly readable
- Could be specific users, roles, or AWS accounts

### 5. **`actions: ['s3:GetObject']`**

- Only allows `GetObject` (read/download files)
- Does NOT allow `PutObject`, `DeleteObject`, etc.
- Users can view images but cannot upload or delete

### 6. **`resources: [`${productImagesBucket.bucketArn}/products/\*`]`**

- `bucketArn` = the bucket's Amazon Resource Name
- `/products/*` = only files in the `products/` folder
- The `*` wildcard means any file in that folder
- **Security**: Only images in `products/` folder are public

`next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['productmanagementstack-images.s3.amazonaws.com'],
  },
};

export default nextConfig;
```

## Delete Product

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ProductRecord } from '../../types/product';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// Environment variables
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const PRODUCT_IMAGES_BUCKET_NAME = process.env.PRODUCT_IMAGES_BUCKET_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Get product ID from path parameters
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Product ID is required',
        }),
      };
    }

    // First, get the product to retrieve the image URL
    let product: ProductRecord;
    try {
      const getResult = await docClient.send(
        new GetCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Key: { id: productId },
        })
      );

      if (!getResult.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Product not found',
          }),
        };
      }

      product = getResult.Item as ProductRecord;
    } catch (dynamoError) {
      console.error('Error retrieving product from DynamoDB:', dynamoError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to retrieve product',
        }),
      };
    }

    // Delete image from S3 if it exists
    if (product.imageUrl) {
      try {
        // Extract S3 key from the URL
        const urlParts = product.imageUrl.split('/');
        const s3Key = urlParts.slice(3).join('/'); // Remove https://bucket-name.s3.amazonaws.com/

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: PRODUCT_IMAGES_BUCKET_NAME,
            Key: s3Key,
          })
        );

        console.log('Image deleted from S3:', s3Key);
      } catch (s3Error) {
        console.error('Error deleting image from S3:', s3Error);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete product from DynamoDB
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Key: { id: productId },
        })
      );

      console.log('Product deleted from DynamoDB:', productId);
    } catch (dynamoError) {
      console.error('Error deleting product from DynamoDB:', dynamoError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to delete product',
        }),
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Product deleted successfully',
        productId: productId,
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
```

- aws console test event

```json
{
  "pathParameters": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

- first get product id by running `getAllProducts.ts` lambda and provide the value
- run the test two times
- test on front-end

## The End

- optional : destroy the stack `npx cdk destroy`

# Project 5 : First SQS Stack

**Services Used**

- API Gateway
- Lambda
- SQS

## Setup

- create `first-sqs` folder and initialize new cdk app `cdk init app --language=typescript`
- install packages `npm i @types/aws-lambda aws-cdk-lib @aws-sdk/client-sqs axios esbuild`

## Package Explanations

**`@types/aws-lambda`** - TypeScript type definitions for AWS Lambda functions. Provides type safety and IntelliSense when writing Lambda functions in TypeScript.

**`aws-cdk-lib`** - The main AWS CDK library containing constructs for AWS resources. This is the core package for defining infrastructure as code using CDK.

**`@aws-sdk/client-sqs`** - The AWS SDK v3 SQS client for JavaScript/TypeScript. Provides a modern, modular API for interacting with Amazon SQS queues. Unlike the older aws-sdk v2, this version is Promise-based by default, has better TypeScript support, and offers smaller bundle sizes through tree-shaking.

**`axios`** - A popular HTTP client library for making HTTP requests. Useful for calling external APIs or services from your Lambda functions.

**`esbuild`** - A fast JavaScript/TypeScript bundler and minifier. CDK uses this to bundle your Lambda function code for deployment, making the deployment process faster and more efficient.

## Challenge

- create two lambdas `producer` and `consumer`
- attach `producer` to http route `orders`
- optional use [API Gateway V1](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html)

## Solution

- create `src/lambdas/handler.ts`

```ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const producer = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { orderId } = JSON.parse(event.body!);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order created',
        orderId,
      }),
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error creating order',
      }),
    };
  }
};

export const consumer = async (): Promise<void> => {
  console.log('finished processing order');
};
```

`stack`

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaBase from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class FirstSqsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Producer Lambda (API Gateway -> SQS)
    const producerLambda = new NodejsFunction(this, 'OrderProducer', {
      runtime: lambdaBase.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'producer',
      functionName: `${this.stackName}-producer`,
    });

    // Create Consumer Lambda (SQS -> Processing)
    const consumerLambda = new NodejsFunction(this, 'OrderConsumer', {
      runtime: lambdaBase.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'consumer',
      functionName: `${this.stackName}-consumer`,
    });

    const api = new apigateway.RestApi(this, 'OrdersApi');

    const orders = api.root.addResource('orders');
    orders.addMethod('POST', new apigateway.LambdaIntegration(producerLambda));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url!,
    });
  }
}
```

## Test Route

```ts
@URL = http://localhost:3000/orders

### Create Order
POST {{URL}}
Content-Type: application/json

{
    "orderId": "123"
}
```

## Batch Requests

- add timeout to `producer` lambda

```ts
await new Promise((resolve) => setTimeout(resolve, 2000));
```

- deploy stack
- test manually, notice the delay

- create `send-requests.js`

```js
import axios from 'axios';

const API_URL = 'yourURL';

console.time('All Requests');

const promises = [];
for (let i = 1; i <= 10; i++) {
  promises.push(
    axios
      .post(API_URL, {
        orderId: `order-${i}`,
      })
      .then((response) => {
        console.log(`Request ${i}:`, response.data);
      })
      .catch((error) => {
        console.error(`Request ${i} failed:`, error.message);
      })
  );
}

await Promise.all(promises);
console.timeEnd('All Requests');
```

- run `node send-requests.js`

```batch
Request 8: { message: 'Order created', orderId: 'order-8' }
Request 9: { message: 'Order created', orderId: 'order-9' }
Request 4: { message: 'Order created', orderId: 'order-4' }
Request 5: { message: 'Order created', orderId: 'order-5' }
Request 6: { message: 'Order created', orderId: 'order-6' }
Request 10: { message: 'Order created', orderId: 'order-10' }
Request 7: { message: 'Order created', orderId: 'order-7' }
Request 3: { message: 'Order created', orderId: 'order-3' }
Request 2: { message: 'Order created', orderId: 'order-2' }
Request 1: { message: 'Order created', orderId: 'order-1' }
All Requests: 2.312s
```

- increase the amount of requests
- since Lambda concurrency is by default set to 10, all requests after that limit will fail
- this concurrency limit is not something SQS will fix, but it's still important to keep in mind

## SQS

Amazon SQS (Simple Queue Service) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. It provides a reliable, highly scalable hosted queue that can handle any volume of messages without losing messages or requiring other services to be available. SQS acts as a buffer between different parts of your application, allowing them to communicate asynchronously without being directly connected. The service automatically handles message storage, delivery, and retry logic. SQS offers two types of queues: Standard queues for maximum throughput with at-least-once delivery, and FIFO queues for exactly-once processing with strict ordering. For this project, we'll use Standard queues since order processing doesn't require strict ordering and we want maximum throughput. In this project, we use SQS to create an asynchronous processing pipeline where the producer Lambda receives HTTP requests and queues orders, while the consumer Lambda processes them independently. This allows the API to respond quickly to users while the actual order processing happens in the background.

**Batch Size Configuration:** The `batchSize: 1` setting in our consumer Lambda means it processes one message at a time from the SQS queue. This ensures each order is processed individually, making debugging easier and preventing one slow order from blocking others. Higher batch sizes (like 10) would process multiple messages in a single Lambda invocation, improving throughput but making error handling more complex.

```ts
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export class FirstSqsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'OrdersQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      queueName: `${this.stackName}-orders-queue`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // Create Producer Lambda (API Gateway -> SQS)
    const producerLambda = new NodejsFunction(this, 'OrderProducer', {
      runtime: lambdaBase.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'producer',
      functionName: `${this.stackName}-producer`,
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });

    queue.grantSendMessages(producerLambda);

    // Create Consumer Lambda (SQS -> Processing)
    const consumerLambda = new NodejsFunction(this, 'OrderConsumer', {
      runtime: lambdaBase.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'consumer',
      functionName: `${this.stackName}-consumer`,
    });

    consumerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 1,
      })
    );

    const api = new apigateway.RestApi(this, 'OrdersApi');

    const orders = api.root.addResource('orders');
    orders.addMethod('POST', new apigateway.LambdaIntegration(producerLambda));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url!,
    });
  }
}
```

```ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'eu-north-1' });

export const producer = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { orderId } = JSON.parse(event.body!);
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL!,
        MessageBody: JSON.stringify({ orderId }),
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order placed in queue',
        orderId,
      }),
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error creating order',
      }),
    };
  }
};
```

**SQS Logic Breakdown:**

1. **SQS Client Initialization:**

    - `new SQSClient({ region: 'eu-north-1' })` - Creates an SQS client instance for the specified AWS region
    - The client handles authentication, request signing, and HTTP communication with SQS

2. **Message Sending Process:**

    - `new SendMessageCommand({...})` - Creates a command object for sending messages to SQS
    - `QueueUrl: process.env.QUEUE_URL!` - Specifies which SQS queue to send the message to
    - `MessageBody: JSON.stringify({ orderId })` - Converts the order data to JSON string (SQS only accepts strings)

3. **Error Handling:**
    - If SQS is unavailable or the queue doesn't exist, the function returns a 500 error
    - This prevents the API from hanging and provides clear feedback to the client

### Consumer Function (SQS → Processing)

```typescript
export const consumer = async (event: SQSEvent): Promise<void> => {
  console.log('Event received :', event);
  const messages = event.Records;
  for (const message of messages) {
    const { orderId } = JSON.parse(message.body);
    console.log('Processing order:', orderId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Finished processing order:', orderId);
  }
};
```

**SQS Event Processing:**

1. **Event Structure:**

    - `SQSEvent` contains an array of `Records` (messages from the queue)
    - Each record represents one message that was sent to the queue
    - Since `batchSize: 1`, there's typically only one record per invocation

2. **Message Processing Loop:**

    - `event.Records` - Array of SQS messages to process
    - `JSON.parse(message.body)` - Converts the JSON string back to an object
    - The loop processes each message individually

3. **Processing Simulation:**

    - `setTimeout(resolve, 2000)` - Simulates 2 seconds of order processing
    - In real applications, this would be replaced with actual business logic (database operations, external API calls, etc.)

4. **Message Acknowledgment:**
    - When the function completes successfully, SQS automatically removes the message from the queue
    - If the function throws an error, the message returns to the queue for retry (based on visibility timeout)

### Visibility Timeout Explained

**What is Visibility Timeout?**
Visibility timeout is the period (in seconds) that a message is invisible to other consumers after being received by one consumer. In our stack, we set it to 30 seconds: `visibilityTimeout: cdk.Duration.seconds(30)`.

**How it Works:**

1. **Message Received:** When a consumer Lambda receives a message from SQS, the message becomes "invisible" to other consumers
2. **Processing Window:** The consumer has 30 seconds to process the message and either:
    - Complete successfully (message is deleted from queue)
    - Throw an error (message becomes visible again for retry)
3. **Timeout Behavior:** If the Lambda function doesn't complete within 30 seconds, the message automatically becomes visible again and can be picked up by another consumer

**Why 30 Seconds?**

- **Too Short:** If set to 10 seconds, long-running processes might timeout before completion
- **Too Long:** If set to 300 seconds, failed messages take too long to retry
- **Just Right:** 30 seconds balances processing time with retry responsiveness

**Real-World Scenarios:**

- **Success:** Order processed in 5 seconds → message deleted, no retry needed
- **Failure:** Database error after 10 seconds → message returns to queue for retry
- **Timeout:** Lambda crashes after 35 seconds → message automatically becomes visible again
- **Long Processing:** Order takes 40 seconds → message times out and gets retried by another Lambda

**Best Practices:**

- Set visibility timeout to 6x your expected processing time
- Monitor CloudWatch logs for timeout patterns
- Adjust based on your actual processing duration

## Test

- run `node send-requests.js`
- notice how `producer` lambda responds faster
- check logs of `consumer` lambda, look for 'Event received'

**Performance Improvement:** With SQS in place, the producer Lambda can now respond immediately after queuing the message, rather than waiting for the entire order processing to complete. The 2-second delay that was previously blocking the API response now happens asynchronously in the background via the consumer Lambda. This means users get instant feedback that their order was received, while the actual processing continues in the background without affecting the API response time.

- increase the batch size

`stack`

```ts
consumerLambda.addEventSource(
  new lambdaEventSources.SqsEventSource(queue, {
    batchSize: 10,
  })
);
```

- make requests and check `consumer` logs one more time

## Dead Letter Queue (DLQ)

**What is a Dead Letter Queue?** A Dead Letter Queue (DLQ) is a separate SQS queue that receives messages that couldn't be processed successfully after multiple retry attempts. When a message fails processing repeatedly (exceeds the maximum receive count), it gets moved to the DLQ instead of being deleted, allowing you to investigate and potentially reprocess failed messages later. This prevents message loss and provides a safety net for handling problematic messages that might be causing processing failures.

**Testing Configuration:** For testing purposes, it's recommended to set the visibility timeout to 1 second (`visibilityTimeout: cdk.Duration.seconds(1)`) when working with DLQs. This allows you to quickly see failed messages appear in the DLQ without waiting for the full visibility timeout period. In production, you would use a more realistic timeout based on your actual processing time.

`stack`

```ts
// Create DLQ
const dlq = new sqs.Queue(this, 'OrdersDLQ', {
  queueName: `${this.stackName}-orders-dlq`,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const queue = new sqs.Queue(this, 'OrdersQueue', {
  visibilityTimeout: cdk.Duration.seconds(1),
  queueName: `${this.stackName}-orders-queue`,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  deadLetterQueue: {
    queue: dlq,
    maxReceiveCount: 3,
  },
});
```

`handler`

```ts
export const consumer = async (event: SQSEvent): Promise<void> => {
  throw new Error('test');
  const messages = event.Records;
  console.log('Event received :', event);
  for (const message of messages) {
    const { orderId } = JSON.parse(message.body);
    console.log('Processing order:', orderId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Finished processing order:', orderId);
  }
};
```

- re-deploy the stack
- send message/s

## The End

- optional : destroy the stack `npx cdk destroy`