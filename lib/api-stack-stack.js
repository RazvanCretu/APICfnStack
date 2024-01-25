const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const nodeLambda = require("aws-cdk-lib/aws-lambda-nodejs");
const cognito = require("aws-cdk-lib/aws-cognito");

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

    // Define User pool

    const userPool = new cognito.UserPool(this, "myFirstUserPool", {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "myFirstUserPoolClient",
      {
        userPool,
        authFlows: {
          userPassword: true,
        },
      }
    );

    // ========== Resource Handlers ==========
    // Define Function that lists all current instances

    const instancesFn = new nodeLambda.NodejsFunction(
      this,
      "InstanceFunction",
      {
        functionName: "getInstances",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/controllers/instances.js",
        role: instancesRole,
      }
    );

    const schedulesFn = new nodeLambda.NodejsFunction(
      this,
      "SchedulesFunction",
      {
        functionName: "getSchedules",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/controllers/schedules.js",
        role: schedulesRole,
      }
    );

    // ========== General Lambdas ==========
    // Define Functions that are used as general cloud resources

    const schedulerFn = new nodeLambda.NodejsFunction(
      this,
      "SchedulerFunction",
      {
        functionName: "Scheduler",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lib/lambdas/scheduler.js",
        role: instancesRole,
      }
    );

    const api = new apiGateway.RestApi(this, "callLambda", {
      restApiName: "SchedulerAPI",
      deployOptions: {
        stageName: "development",
      },
    });

    api.root.resourceForPath("instances").addMethod(
      "ANY", // All methods on /instances
      new apiGateway.LambdaIntegration(instancesFn)
    );

    api.root.resourceForPath("schedules").addMethod(
      "ANY", // All methods on /schedules
      new apiGateway.LambdaIntegration(schedulesFn)
    );

    new cdk.CfnOutput(this, "SchedulerArn", { value: schedulerFn.functionArn });
    new cdk.CfnOutput(this, "RoleArn", { value: schedulerRole.roleArn });
  }
}

module.exports = { ApiStack };
