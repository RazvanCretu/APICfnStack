import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

export async function handler(event, context) {
  try {
    const client = new EC2Client({ region: "eu-central-1" });
    const command = new DescribeInstancesCommand({});

    const resp = await client.send(command);

    console.log(context);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: resp.Reservations[0].Instances.map((i) => ({
          id: i.InstanceId,
          type: i.InstanceType,
          ipv4Private: i.PrivateIpAddress,
          ipv4Public: i.PublicIpAddress,
          state: i.State.Name,
          tags: i.Tags,
        })),
        error: null,
      }),
    };
  } catch (err) {
    return {
      statusCode: err.$metadata.httpStatusCode,
      body: JSON.stringify({
        data: null,
        error: { code: err.Code, message: err.message },
      }),
    };
  }
}
