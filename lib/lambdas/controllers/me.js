import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  UpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export async function handler(event, ctx) {
  try {
    const cognito = new CognitoIdentityProviderClient({});

    const { token } = event.queryStringParameters;

    switch (event.requestContext.httpMethod) {
      case "GET": {
        const getMeCommand = new GetUserCommand({ AccessToken: token });
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
