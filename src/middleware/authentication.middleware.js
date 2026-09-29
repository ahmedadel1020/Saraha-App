import { tokenTypeEnum } from "../common/enum/security.enum.js";
import {
  ForbiddenException,
  UnauthorizedException,
} from "../common/exceptions/index.js";
import { basicAuth, decodeToken } from "../common/security/index.js";

export const authentication = (tokenType = tokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) throw UnauthorizedException();
    const [key, credential] = authorization.split(" ");
    console.log(key, credential);
    switch (key) {
      case "Basic":
        const [email, password] = Buffer.from(credential, "base64")
          .toString()
          .split(":");
        req.user = await basicAuth({ email, password });
        break;
      case "Bearer":
        const { user, payload } = await decodeToken({
          authorization: credential,
          tokenType,
        });
        req.user = user;
        req.payload = payload;
        break;
      default:
        next(new Error("invalid authentication", { cause: { status: 400 } }));
        break;
    }

    next();
  };
};

export const authorization = (accessRole) => {
  return async (req, res, next) => {
    if (req.user.role < accessRole) {
      throw ForbiddenException();
    }
    next();
  };
};
