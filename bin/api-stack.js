#!/usr/bin/env node

const { App } = require("aws-cdk-lib");
const { ApiStack } = require("../lib/api-stack-stack");

const app = new App();
new ApiStack(app, "ApiStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  stackName: "ApiStack",
  description: "A simple API stack with Cognito, ApiGateway, Lambdas, etc.",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
