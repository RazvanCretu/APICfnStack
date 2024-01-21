// import { EventBridgeClient, List } from "@aws-sdk/client-eventbridge";
import {
  SchedulerClient,
  ListSchedulesCommand,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";

export async function handler(event, context) {
  try {
    const client = new SchedulerClient({ region: "eu-central-1" });
    const createSchedule = new CreateScheduleCommand({
      Name: "Test1",
      ScheduleExpression: "cron(*/5 * * * ? *)",
      FlexibleTimeWindow: { Mode: "OFF" },
      Target: {
        Arn: "arn:aws:lambda:eu-central-1:423577484048:function:Scheduler", // The target that is scheduled, usually a lambda function to trigger an EC2 creation.
        RoleArn: "arn:aws:iam::423577484048:role/SchedulerRole",
      },
    });
    const listSchedules = new ListSchedulesCommand({});

    const resp = await client.send(listSchedules);

    console.log(context);

    return {
      statusCode: 200,
      body: JSON.stringify({
        metadata: resp.$metadata,
        data: resp.Schedules,
        error: null,
      }),
    };
  } catch (err) {
    return {
      statusCode: err.$metadata.httpStatusCode,
      body: JSON.stringify({
        metadata: err,
        data: null,
        error: { code: err.Code, message: err.message },
      }),
    };
  }
}
