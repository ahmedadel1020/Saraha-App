import { tokenTypeEnum } from "../common/enum/security.enum.js";
import { UnauthorizedException } from "../common/exceptions/index.js";
import { decodeToken } from "../common/security/index.js";

export const authentication = (tokenType = tokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) throw UnauthorizedException();
    const { user, payload } = await decodeToken({ authorization, tokenType });
    req.user = user;
    req.payload = payload;
    next();
  };
};
