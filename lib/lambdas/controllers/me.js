import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export async function handler(event, ctx) {
  try {
    const cognito = new CognitoIdentityProviderClient({});

    const { accessToken } = JSON.parse(event.body);

    switch (event.requestContext.httpMethod) {
      case "POST": {
        const getMeCommand = new GetUserCommand({ AccessToken: accessToken });
        const me = await cognito.send(getMeCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            request: event.requestContext,
            response: me,
            error: null,
          }),
        };
      }
      default: {
        return {
          statusCode: 501,
          body: JSON.stringify({
            request: event.requestContext,
            response: null,
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
        response: null,
        error: err,
      }),
    };
  }
}
