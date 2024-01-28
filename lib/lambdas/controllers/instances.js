import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

export async function handler(e, ctx) {
  try {
    const ec2 = new EC2Client({});

    switch (e.requestContext.httpMethod) {
      case "GET": {
        const command = new DescribeInstancesCommand({});
        const resp = await ec2.send(command);

        return {
          statusCode: 200,
          body: JSON.stringify({
            request: e.requestContext,
            data: resp,
            error: null,
          }),
        };
      }
      default: {
        return {
          statusCode: 501,
          body: JSON.stringify({
            request: e.requestContext,
            data: null,
            error: `Method '${e.requestContext.httpMethod}' not implemented`,
          }),
        };
      }
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        request: e.requestContext,
        data: null,
        error: err,
      }),
    };
  }
}
