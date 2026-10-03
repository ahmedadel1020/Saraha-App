import { create, findOne } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/index.js";
import { hash, compare } from "../../common/security/index.js";
import {
  decrypt,
  encryption,
} from "../../common/security/encryption.security.js";
import {
  createLoginCredintials,
  createToken,
} from "../../common/security/token.security.js";

import { OAuth2Client } from "google-auth-library";
import { WEB_CLIENT_ID } from "../../../config/config.service.js";

import { ProviderEnum } from "../../common/enum/user.enum.js";
const client = new OAuth2Client();
async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload.email_verified)
    throw BadRequestException({ message: "email not Verified" });
  return payload;
}
export const signup = async (inputs) => {
  const { email, password, username, phone, gender } = inputs.body;
  const duplicated = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
  });
  if (duplicated) throw ConflictException({ message: "duplicated account" });
  const account = await create({
    model: userModel,
    data: {
      email,
      password: await hash(password),
      username,
      phone: await encryption(phone),
      gender,
    },
  });
  return account;
};

export const signupWithGmail = async ({ idToken }, issuer) => {
  const { name, email, picture } = await verifyGoogleAccount(idToken);
  let status = 201;
  const existAcc = await findOne({ model: userModel, filter: { email } });
  if (existAcc) {
    if (existAcc.provider != ProviderEnum.GOOGLE) {
      throw ConflictException({ message: "user already exist" });
    }
    status = 200;
    return {
      status: 200,
      data: await createLoginCredintials({ user: existAcc, issuer }),
    };
  }
  const user = await create({
    model: userModel,
    data: {
      username: name,
      email,
      confirmemail: new Date(),
      provider: ProviderEnum.GOOGLE,
      image: picture,
    },
  });
  return {
    status: 201,
    data: await createLoginCredintials({ user, issuer }),
  };
};

export const login = async ({ email, password }, issuer) => {
  const account = await findOne({
    model: userModel,
    filter: { email, provider: ProviderEnum.SYSTEM },
  });
  if (!account) throw NotFoundException({ message: "user not found" });
  const match = await compare(password, account.password);
  if (!match) throw NotFoundException({ message: "incorrect password" });
  return await createLoginCredintials({ user: account, issuer });
};
