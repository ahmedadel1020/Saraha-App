import jwt from "jsonwebtoken";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIERS_IN,
  ACCESS_TOKEN_SIGNATURE,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIERS_IN,
  REFRESH_TOKEN_SIGNATURE,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../../config/config.service.js";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/error.exception.js";
import { findById } from "../repository/base.repository.js";
import { userModel } from "../../DB/model/user.model.js";
import { tokenTypeEnum } from "../enum/security.enum.js";
import { RoleEnum } from "../enum/user.enum.js";

export const createToken = async ({
  payload = {},
  options = {},
  secret = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token = "",
  secret = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.verify(token, secret);
};
const getTokenSignature = async ({ role = RoleEnum.USER } = {}) => {
  let signatures;
  switch (role) {
    case RoleEnum.ADMIN:
      signatures = {
        accessSignature: ACCESS_ADMIN_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
      break;

    default:
      signatures = {
        accessSignature: ACCESS_USER_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_USER_TOKEN_SIGNATURE,
      };
      break;
  }
  return signatures;
};

const getSignature = async ({
  tokenType = tokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const signatures = await getTokenSignature({ role });
  return tokenType == tokenTypeEnum.ACCESS
    ? signatures.accessSignature
    : signatures.refreshSignature;
};

export const decodeToken = async ({
  authorization = "",
  tokenType = tokenTypeEnum.ACCESS,
} = {}) => {
  const decoded = jwt.decode(authorization);
  console.log(decoded);
  if (!decoded.aud?.length) {
    throw BadRequestException();
  }
  const payload = await verifyToken({
    token: authorization,
    secret: await getSignature({ tokenType }),
  });
  if (!payload?.sub) throw BadRequestException();
  const user = await findById({
    model: userModel,
    id: payload.sub,
  });
  if (!user) throw NotFoundException();
  return { user, payload };
};

export const createLoginCredintials = async ({
  user,
  issuer,
  options = {},
}) => {
  const { accessSignature, refreshSignature } = await getTokenSignature({
    role: user.role,
  });
  const access_token = await createToken({
    payload: { sub: user._id },
    options: {
      ...options,
      issuer,
      audience: [user.role],
      expiresIn: ACCESS_TOKEN_EXPIERS_IN,
    },
    secret: accessSignature,
  });
  const refresh_token = await createToken({
    payload: { sub: user._id },
    options: {
      ...options,
      issuer,
      audience: [user.role],
      expiresIn: REFRESH_TOKEN_EXPIERS_IN,
    },
    secret: refreshSignature,
  });
  return { access_token, refresh_token };
};
