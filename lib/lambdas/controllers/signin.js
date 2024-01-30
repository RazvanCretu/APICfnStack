const { authenticate } = require("ldap-authentication");
const jwt = require("jsonwebtoken");

export const handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);

    if (username === undefined || password === undefined) {
      return {
        statusCode: 400,
        body: "Missing username or password",
      };
    }

    const user = await authenticate({
      ldapOpts: {
        url: "ldap://ldap.forumsys.com:389",
      },
      userDn: `uid=${username},dc=example,dc=com`,
      userPassword: password,
      userSearchBase: "dc=example,dc=com",
      usernameAttribute: "uid",
      username: username,
    });

    switch (event.requestContext.httpMethod) {
      case "POST": {
        return {
          statusCode: 200,
          body: JSON.stringify({
            request: event.requestContext,
            data: jwt.sign(user, process.env.JWT_SECRET, {
              algorithm: "HS512",
              expiresIn: "6h",
            }),
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
      statusCode: err?.$metadata?.httpStatusCode || 500,
      body: JSON.stringify({
        request: event.requestContext,
        data: null,
        error:
          err?.name == "LdapAuthenticationError"
            ? { message: "You are not able to register!" }
            : err,
      }),
    };
  }
};
