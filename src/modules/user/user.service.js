import jwt from "jsonwebtoken";
import { findById, findByIdAndUpdate } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  createLoginCredintials,
  createToken,
  verifyToken,
} from "../../common/security/token.security.js";
import {
  ACCESS_TOKEN_EXPIERS_IN,
  REFRESH_TOKEN_EXPIERS_IN,
  REFRESH_TOKEN_SIGNATURE,
} from "../../../config/config.service.js";
import { ConflictException } from "../../common/exceptions/error.exception.js";
export const profile = async (account) => {
  return account;
};

export const update = async (user, data) => {
  const account = findByIdAndUpdate({
    model: userModel,
    id: user._id,
    update: data,
  });
  return account;
};

export const rotateToken = async (payload, user, issuer) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIERS_IN) * 1000;
  const currenttime = 30 * 60000 + Date.now();
  if (currenttime < accessExpiresIn) {
    throw ConflictException();
  }
  return await createLoginCredintials({ user, issuer });
};
