import { create, findOne } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/error.exception.js";
import { hash, compare } from "../../common/security/hash.security.js";
import jwt from "jsonwebtoken";
import {
  decrypt,
  encryption,
} from "../../common/security/encryption.security.js";
import {
  createLoginCredintials,
  createToken,
} from "../../common/security/token.security.js";
import {
  ACCESS_TOKEN_EXPIERS_IN,
  REFRESH_TOKEN_EXPIERS_IN,
  REFRESH_TOKEN_SIGNATURE,
} from "../../../config/config.service.js";
export const signup = async ({ email, password, username, phone }) => {
  const duplicated = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
  });
  if (duplicated) throw ConflictException();
  const account = await create({
    model: userModel,
    data: {
      email,
      password: await hash(password),
      username,
      phone: await encryption(phone),
    },
  });
  return account;
};

export const login = async ({ email, password }, issuer) => {
  const account = await findOne({
    model: userModel,
    filter: { email },
  });
  if (!account) throw NotFoundException();
  const match = await compare(password, account.password);
  if (!match) throw NotFoundException();
  return await createLoginCredintials({ user: account, issuer });
};
