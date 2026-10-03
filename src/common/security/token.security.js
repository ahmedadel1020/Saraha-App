import jwt from "jsonwebtoken";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIERS_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIERS_IN,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../../config/config.service.js";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../exceptions/index.js";
import { findById, findOne } from "../repository/base.repository.js";
import { userModel } from "../../DB/model/user.model.js";
import { tokenTypeEnum } from "../enum/security.enum.js";
import { RoleEnum } from "../enum/user.enum.js";
import { compare } from "./hash.security.js";
import { randomUUID } from "node:crypto";
import { exist, set } from "../services/cache.service.js";
export const userBaseKey = ({ userid }) => {
  return `User::${userid.toString()}`;
};
export const userBaseRevokeTokenKey = ({ userid }) => {
  return `${userBaseKey({ userid })}::Revoke_Token`;
};

export const userRevokeTokenKey = ({ userid, jti }) => {
  return `${userBaseRevokeTokenKey({ userid })}${jti}`;
};
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
  console.log({ decoded: decoded });
  if (!decoded.aud?.length) {
    throw BadRequestException();
  }
  const payload = await verifyToken({
    token: authorization,
    secret: await getSignature({ tokenType }),
  });
  if (!payload?.sub) throw BadRequestException();
  if (
    await exist({
      key: userRevokeTokenKey({ userid: payload.sub, jti: payload.jti }),
    })
  ) {
    throw UnauthorizedException({ message: "expires login credentials" });
  }
  const user = await findById({
    model: userModel,
    id: payload.sub,
  });
  if (!user) throw NotFoundException({ message: "user not found" });

  if ((user.changeCredentialsTime?.getTime() ?? 0) > payload.iat * 1000) {
    throw UnauthorizedException({ message: "expires login credentials" });
  }
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
  const jwtid = randomUUID();
  const access_token = await createToken({
    payload: { sub: user._id },
    options: {
      ...options,
      issuer,
      audience: [user.role],
      expiresIn: ACCESS_TOKEN_EXPIERS_IN,
      jwtid,
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
      jwtid,
    },
    secret: refreshSignature,
  });
  return { access_token, refresh_token };
};

export const basicAuth = async ({ email, password }) => {
  const user = await findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) throw NotFoundException({ message: "user not found" });
  const match = await compare(password, user.password);
  if (!match) throw NotFoundException({ message: "password mismatched" });
  return user;
};

export const createRevokeToken = async ({ payload }) => {
  const consumedTime = Math.ceil(Date.now() / 1000) - payload.iat;
  const refreshExpiresIn = payload.iat - REFRESH_TOKEN_EXPIERS_IN;
  const ttl = refreshExpiresIn - consumedTime;
  await set({
    key: userRevokeTokenKey({ userid: payload.sub, jti: payload.jti }),
    value: payload.jti,
    ttl,
  });
  return;
};
