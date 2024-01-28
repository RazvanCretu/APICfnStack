import {
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
const { authenticate } = require("ldap-authentication");

export const handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);

    console.log(event);

    const user = await authenticate({
      ldapOpts: {
        url: "ldap://ldap.forumsys.com:389",
      },
      userDn: `uid=${username},dc=example,dc=com`,
      userPassword: password,
      userSearchBase: "dc=example,dc=com",
      usernameAttribute: "uid",
      username: username,
    });

    const clientIP = new CognitoIdentityProviderClient({});

    if (username === undefined || password === undefined) {
      return {
        statusCode: 400,
        body: "Missing username or password",
      };
    }

    switch (event.requestContext.httpMethod) {
      case "POST": {
        const adminGetUserCommand = new AdminGetUserCommand({
          Username: username,
          UserPoolId: process.env.USER_POOL_ID,
        });
        const cognitoUser = await clientIP.send(adminGetUserCommand);

        if (cognitoUser.UserStatus === "FORCE_CHANGE_PASSWORD") {
          const signInCommand = new AdminInitiateAuthCommand({
            AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
            AuthParameters: {
              USERNAME: user.uid,
              PASSWORD: "!Qcp3U7uiSTPwG1WsuAHcxg==",
            },
            UserPoolId: process.env.USER_POOL_ID,
            ClientId: process.env.USER_POOL_CLIENT_ID,
          });
          const adminSingInResponse = await clientIP.send(signInCommand);

          const respToChallangeCommand = new AdminRespondToAuthChallengeCommand(
            {
              ChallengeName: "NEW_PASSWORD_REQUIRED",
              ChallengeResponses: {
                USERNAME: user.uid,
                NEW_PASSWORD: user.userPassword,
              },
              Session: adminSingInResponse.Session,
              UserPoolId: process.env.USER_POOL_ID,
              ClientId: process.env.USER_POOL_CLIENT_ID,
            }
          );
          const challangeResponse = await clientIP.send(respToChallangeCommand);

          return {
            statusCode: 200,
            body: JSON.stringify({
              request: event.requestContext,
              data: challangeResponse,
              error: null,
            }),
          };
        } else {
          const signInCommand = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
              USERNAME: user.uid,
              PASSWORD: user.userPassword,
            },
            ClientId: process.env.USER_POOL_CLIENT_ID,
          });
          const signInResponse = await clientIP.send(signInCommand);

          return {
            statusCode: 200,
            body: JSON.stringify({
              request: event.requestContext,
              data: signInResponse,
              error: null,
            }),
          };
        }
      }
      default: {
        return {
          statusCode: 501,
          body: JSON.stringify({
            request: event.requestContext,
            data: null,
            error: `Method '${event.requestContext.httpMethod}' not implemented`,
          }),
        };
      }
    }
  } catch (err) {
    return {
      statusCode: err?.$metadata?.httpStatusCode || 500,
      body: JSON.stringify({
        request: event.requestContext,
        data: null,
        error:
          err?.name == "LdapAuthenticationError"
            ? { message: "You are not able to register!" }
            : err,
      }),
    };
  }
};
