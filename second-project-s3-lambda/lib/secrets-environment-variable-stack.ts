import * as cdk from "aws-cdk-lib";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class SecretsManagerStack extends cdk.Stack {
  public readonly secrets: secretsManager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // fetch secrets using the key name

    // here, secretName will not be the same as secret key, use a different name for this secret key
    this.secrets = new secretsManager.Secret(this, "MySecrets", {
      secretName: "secret_keys",
      secretObjectValue: {},
    });

    // apply destroy Policy, so if resource is deleted, then it is also deleted physically
    this.secrets.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // show output for this secret key
    new cdk.CfnOutput(this, "SecretsManagerStack", {
      value: this.secrets.secretArn,
      description: "The secret from secrets manager",
    });
  }
}
