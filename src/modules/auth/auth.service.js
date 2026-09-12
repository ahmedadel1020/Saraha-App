import { create, findOne } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/error.exception.js";
import { hash, compare } from "../../common/security/hash.security.js";

export const signup = async ({ email, password, firstName, lastName }) => {
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
      firstName,
      lastName,
    },
  });
  return account;
};

export const login = async ({ email, password }) => {
  const account = await findOne({
    model: userModel,
    filter: { email },
  });
  if (!account) throw NotFoundException();
  const match = await compare(password, account.password);
  if (!match) throw NotFoundException();
  return account;
};
