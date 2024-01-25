import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  try {
    const { username, password, email } = JSON.parse(event.body);
    const clientIP = new CognitoIdentityProviderClient({});

    if (
      username === undefined ||
      password === undefined ||
      email === undefined
    ) {
      return {
        statusCode: 400,
        body: "Missing username, email or password",
      };
    }

    switch (event.requestContext.httpMethod) {
      case "POST": {
        const registerCommand = new SignUpCommand({
          ClientId: process.env.USER_POOL_ID,
          Username: username,
          Password: password,
          UserAttributes: [
            {
              Name: "email",
              Value: email,
            },
          ],
        });
        const resp = await clientIP.send(registerCommand);

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
      statusCode: 500,
      body: JSON.stringify({
        request: event.requestContext,
        data: null,
        error: err,
      }),
    };
  }
};
