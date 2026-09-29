import { findByIdAndUpdate } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  createLoginCredintials,
  createRevokeToken,
  userBaseRevokeTokenKey,
} from "../../common/security/token.security.js";
import { ACCESS_TOKEN_EXPIERS_IN } from "../../../config/config.service.js";
import { ConflictException } from "../../common/exceptions/error.exception.js";
import { del, keys } from "../../common/services/cache.service.js";
import { LogoutEnum } from "../../common/enum/security.enum.js";
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
  const data = await createLoginCredintials({ user, issuer });
  await createRevokeToken({ payload });
  return data;
};

export const logout = async (payload, user, { action = LogoutEnum.DEVICE }) => {
  switch (action) {
    case LogoutEnum.ALL:
      user.changeCredentialsTime = new Date();
      await user.save();
      await del({
        key: await keys({
          prefix: userBaseRevokeTokenKey({ userid: payload.sub }),
        }),
      });
      break;

    default:
      await createRevokeToken({ payload });
      break;
  }
  return;
};
