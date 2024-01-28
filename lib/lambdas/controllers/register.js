import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
const { authenticate } = require("ldap-authentication");

export const handler = async (event) => {
  try {
    const {
      username,
      // password,
      email,
    } = JSON.parse(event.body);

    const user = await authenticate({
      ldapOpts: {
        url: "ldap://ldap.forumsys.com:389",
      },
      userDn: `uid=gauss,dc=example,dc=com`,
      userPassword: "password",
      // verifyUserExists: true,
      userSearchBase: "dc=example,dc=com",
      usernameAttribute: "uid",
      username: username,
      // attributes: ["mail"],
    });

    // console.log(user.uid);

    const clientIP = new CognitoIdentityProviderClient({});

    if (
      username === undefined ||
      // password === undefined ||
      email === undefined
    ) {
      return {
        statusCode: 400,
        body: "Missing username, email or password",
      };
    }

    switch (event.requestContext.httpMethod) {
      case "POST": {
        const createUserCommand = new AdminCreateUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: user.uid,
          TemporaryPassword: "!Qcp3U7uiSTPwG1WsuAHcxg==",
          UserAttributes: [
            {
              Name: "email",
              Value: email,
            },
            {
              // Don't verify email addresses
              Name: "email_verified",
              Value: "true",
            },
          ],
        });
        // const registerCommand = new SignUpCommand({
        //   ClientId: process.env.USER_POOL_CLIENT_ID,
        //   Username: username,
        //   Password: password,
        //   UserAttributes: [
        //     {
        //       Name: "email",
        //       Value: email,
        //     },
        //   ],
        // });

        const resp = await clientIP.send(createUserCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            request: event.requestContext,
            data: resp,
            error: null,
          }),
        };
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
