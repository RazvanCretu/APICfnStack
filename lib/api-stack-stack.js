const { Stack, Duration } = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const nodeLambda = require("aws-cdk-lib/aws-lambda-nodejs");
// const cognito = require("aws-cdk-lib/aws-cognito");

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

    const lambdasRole = new iam.Role(this, "LambdasRole", {
      roleName: "LambdasFunction",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        // iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
      ],
    });

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

    const pyRole = new iam.Role(this, "PyRole", {
      roleName: "PyFunction",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
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

    // const userPool = new cognito.UserPool(this, "ApiUserPool", {
    //   userPoolName: "ApiUsers",
    //   selfSignUpEnabled: true,
    //   autoVerify: {
    //     email: true,
    //   },
    // });

    // const userPoolClient = new cognito.UserPoolClient(
    //   this,
    //   "ApiUserPoolClient",
    //   {
    //     // userPool,
    //     accessTokenValidity: Duration.hours(6),
    //     idTokenValidity: Duration.hours(6),
    //     refreshTokenValidity: Duration.hours(6),
    //     authFlows: {
    //       userPassword: true,
    //     },
    //   }
    // );

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

    // const registerFn = new nodeLambda.NodejsFunction(this, "Register", {
    //   functionName: "registerFn",
    //   entry: "lib/lambdas/controllers/register.js",
    //   environment: {
    //     // USER_POOL_ID: userPool.userPoolId,
    //     // USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    //   },
    // });

    // registerFn.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: ["cognito-idp:SignUp", "cognito-idp:AdminCreateUser"],
    //     resources: [userPool.userPoolArn],
    //   })
    // );

    const signInFn = new nodeLambda.NodejsFunction(this, "SignIn", {
      functionName: "signInFn",
      entry: "lib/lambdas/controllers/signin.js",
      environment: {
        // USER_POOL_ID: userPool.userPoolId,
        // USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        JWT_SECRET: process.env.JWT_SECRET,
      },
    });

    // signInFn.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: [
    //       "cognito-idp:InitiateAuth",
    //       "cognito-idp:AdminInitiateAuth",
    //       "cognito-idp:AdminGetUser",
    //       "cognito-idp:AdminRespondToAuthChallenge",
    //     ],
    //     resources: [userPool.userPoolArn],
    //   })
    // );

    // const fetchMeFn = new nodeLambda.NodejsFunction(this, "Me", {
    //   functionName: "meFn",
    //   entry: "lib/lambdas/controllers/me.js",
    // });

    // fetchMeFn.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: ["cognito-idp:GetUser"],
    //     resources: [userPool.userPoolArn],
    //   })
    // );

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
    test;
    const pyFn = new lambda.Function(this, "Test", {
      functionName: "pyFn",
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "test.handler",
      code: lambda.Code.fromAsset("lib/lambdas/test", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -a . /asset-output",
          ],
        },
      }),
      role: pyRole,
    });

    // ========== API & Resources ==========
    // Define Resources and assign according handlers

    const api = new apiGateway.RestApi(this, "API", {
      restApiName: "SchedulerAPI",
      deployOptions: {
        stageName: "development",
      },
    });

    const authorizerFn = new nodeLambda.NodejsFunction(this, "AuthorizerFn", {
      functionName: "authorizerFn",
      entry: "lib/lambdas/authorizer.js",
      environment: {
        JWT_SECRET: process.env.JWT_SECRET,
      },
    });

    const authorizer = new apiGateway.RequestAuthorizer(this, "Authorizer", {
      handler: authorizerFn,
      identitySources: [apiGateway.IdentitySource.header("Authorization")],
      assumeRole: lambdasRole,
    });

    // api.root
    //   .resourceForPath("register") // POST /register
    //   .addMethod("ANY", new apiGateway.LambdaIntegration(registerFn));

    api.root
      .resourceForPath("signin") // POST /signin
      .addMethod("ANY", new apiGateway.LambdaIntegration(signInFn));

    api.root
      .resourceForPath("test") // POST /signin
      .addMethod("ANY", new apiGateway.LambdaIntegration(pyFn));

    // api.root
    //   .resourceForPath("me") // ALL /me
    //   .addMethod("ANY", new apiGateway.LambdaIntegration(fetchMeFn), {
    //     authorizer,
    //   });

    api.root
      .resourceForPath("instances") // All /instances
      .addMethod("ANY", new apiGateway.LambdaIntegration(instancesFn), {
        authorizer,
      });

    api.root
      .resourceForPath("schedules") // All /schedules
      .addMethod("ANY", new apiGateway.LambdaIntegration(schedulesFn), {
        authorizer,
      });
  }
}

module.exports = { ApiStack };
