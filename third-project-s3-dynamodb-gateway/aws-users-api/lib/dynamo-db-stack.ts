import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class DynamoDBStack extends cdk.Stack {
  public readonly userTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // generating a new table with the configuration
    this.userTable = new dynamodb.Table(this, "User", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING }, // It's the primary key used to uniquely identify each item in your table. here every item in table will be of type string
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // billing mode to pay as you consume
      removalPolicy: cdk.RemovalPolicy.DESTROY, // removal policy to destroy if resource is removed
      tableName: `${this.stackName}-user-table`, // table name
    });
  }
}
