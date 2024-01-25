const { Stack } = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const nodeLambda = require("aws-cdk-lib/aws-lambda-nodejs");
const cognito = require("aws-cdk-lib/aws-cognito");

class ApiStack extends Stack {
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

    // ========== Resource Handlers ==========
    // Define Functions that handle all methods for all current rosources

    const registerFn = new nodeLambda.NodejsFunction(this, "Register", {
      functionName: "registerFn",
      entry: "lib/lambdas/controllers/register.js",
      environment: {
        USER_POOL_ID: userPoolClient.userPoolClientId,
      },
    });

    registerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:SignUp"],
        resources: [userPool.userPoolArn],
      })
    );

    const instancesFn = new nodeLambda.NodejsFunction(this, "Instances", {
      functionName: "instancesFn",
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "lib/lambdas/controllers/instances.js",
      role: instancesRole,
    });

    const schedulesFn = new nodeLambda.NodejsFunction(this, "Schedules", {
      functionName: "schedulesFn",
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "lib/lambdas/controllers/schedules.js",
      role: schedulesRole,
      environment: {
        SCHEDULER_ARN: schedulerFn.functionArn,
        ROLE_ARN: schedulerRole.roleArn,
      },
    });

    // ========== API & Resources ==========
    // Define Resources and assign according handlers

    const api = new apiGateway.RestApi(this, "API", {
      restApiName: "SchedulerAPI",
      deployOptions: {
        stageName: "development",
      },
    });

    api.root
      .resourceForPath("register") // POST /instances
      .addMethod("ANY", new apiGateway.LambdaIntegration(registerFn));

    api.root
      .resourceForPath("instances") // All /instances
      .addMethod("ANY", new apiGateway.LambdaIntegration(instancesFn));

    api.root
      .resourceForPath("schedules") // All /schedules
      .addMethod("ANY", new apiGateway.LambdaIntegration(schedulesFn));
  }
}

module.exports = { ApiStack };
