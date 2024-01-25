import {
  SchedulerClient,
  ListSchedulesCommand,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";

export async function handler(e, ctx) {
  try {
    const scheduler = new SchedulerClient({ region: "eu-central-1" });

    switch (e.requestContext.httpMethod) {
      case "GET": {
        const listSchedules = new ListSchedulesCommand({});
        const resp = await scheduler.send(listSchedules);

        return {
          statusCode: 200,
          body: JSON.stringify({
            request: e.requestContext,
            data: resp,
            error: null,
          }),
        };
      }
      case "POST": {
        const createSchedule = new CreateScheduleCommand({
          Name: "Test1",
          ScheduleExpression: "cron(*/5 * * * ? *)",
          FlexibleTimeWindow: { Mode: "OFF" },
          Target: {
            Arn: "arn:aws:lambda:eu-central-1:423577484048:function:Scheduler", // The target that is scheduled, usually a lambda function to trigger an EC2 creation.
            RoleArn: "arn:aws:iam::423577484048:role/SchedulerRole", // Role needed for scheduler to run the lambda function
          },
        });
        const resp = await scheduler.send(createSchedule);

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
            error: `Method' ${e.requestContext.httpMethod}' not implemented`,
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
