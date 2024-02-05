const jwt = require("jsonwebtoken");

export const handler = async (event) => {
  try {
    const token = event.headers.Authorization.split(" ")[1];

    const user = jwt.verify(token, process.env.JWT_SECRET);

    return generatePolicy(event, user);
  } catch (err) {
    console.log(err);
    return generatePolicy(event);
  }
};

const generatePolicy = (e, user) => {
  return {
    principalId: user?.uid || "0",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: user ? "Allow" : "Deny",
          Resource: e.methodArn,
        },
      ],
    },
    context: {
      user: user ? JSON.stringify(user) : "",
    },
  };
};
