const jwt = require("jsonwebtoken");

export const handler = async (event, ctx, callback) => {
  try {
    const token = event.headers.Authorization.split(" ")[1];

    const user = jwt.verify(token, process.env.JWT_SECRET);

    console.log(user);

    return {
      principalId: user.uid,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    };
  } catch (err) {
    console.log(err);
    return {
      principalId: "123456",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
