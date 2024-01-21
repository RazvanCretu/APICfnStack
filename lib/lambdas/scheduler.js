import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";

export async function handler(event, context) {
  try {
    const client = new EC2Client({ region: "eu-central-1" });
    const command = new RunInstancesCommand({
      MinCount: 1,
      MaxCount: 1,
      InstanceInitiatedShutdownBehavior: "terminate",
    });

    const resp = await client.send(command);

    console.log(resp);

    // return;
  } catch (err) {
    console.log(err);
    // return;
  }
}
