const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const nodeLambda = require("aws-cdk-lib/aws-lambda-nodejs");

class ApiStack extends cdk.Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Define role that will be use by InstanceFunction

    const instancesRole = new iam.Role(this, "InstancesFunctionRole", {
      roleName: "InstancesFunction",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
      ],
    });

    const schedulesRole = new iam.Role(this, "ScheudlesFunctionRole", {
      roleName: "SchedulesFunction",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonEventBridgeSchedulerFullAccess"
        ),
      ],
    });

    const schedulerRole = new iam.Role(this, "SchedulerRole", {
      roleName: "SchedulerRole",
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
      ],
    });

    // Define Function that lists all current instances

    const instancesFunction = new nodeLambda.NodejsFunction(
      this,
      "InstanceFunction",
      {
        functionName: "ListInstances",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/instances.js",
        handler: "handler",
        role: instancesRole,
      }
    );

    const schedulesFunction = new nodeLambda.NodejsFunction(
      this,
      "SchedulesFunction",
      {
        functionName: "ListSchedules",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/schedules.js",
        handler: "handler",
        role: schedulesRole,
      }
    );

    const schedulerFn = new nodeLambda.NodejsFunction(
      this,
      "SchedulerFunction",
      {
        functionName: "Scheduler",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/scheduler.js",
        handler: "handler",
        role: instancesRole,
      }
    );

    const api = new apiGateway.RestApi(this, "callLambda", {
      restApiName: "SchedulerAPI",
    });

    const instancesResource = api.root.resourceForPath("instances");
    instancesResource.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(instancesFunction)
    );

    const scheudlesResource = api.root.resourceForPath("schedules");
    scheudlesResource.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(schedulesFunction)
    );

    new cdk.CfnOutput(this, "SchedulerArn", { value: schedulerFn.functionArn });
    new cdk.CfnOutput(this, "RoleArn", { value: schedulerRole.roleArn });
  }
}

module.exports = { ApiStack };
