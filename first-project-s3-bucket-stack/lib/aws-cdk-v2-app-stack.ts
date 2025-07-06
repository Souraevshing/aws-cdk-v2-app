import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class AwsCdkV2AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "FirstCdkProjectBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: "my-bucket-5933",
      autoDeleteObjects: true,
    });

    const bucket2 = new s3.Bucket(this, "SecondCdkProjectBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: "aws-cdk-v2-second-cdk-project-bucket",
      autoDeleteObjects: true,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: `${bucket.bucketName}`,
      description: "Bucket name",
    });
  }
}
