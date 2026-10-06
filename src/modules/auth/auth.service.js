import { create, findOne } from "../../common/repository/index.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  TooManyRequestsException,
} from "../../common/exceptions/index.js";
import { hash, compare } from "../../common/security/index.js";
import { encryption } from "../../common/security/encryption.security.js";
import { createLoginCredintials } from "../../common/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { WEB_CLIENT_ID } from "../../../config/config.service.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import {
  createOtp,
  emailEvent,
  userEmailKey,
  userEmailTrialsKey,
} from "../../common/utils/index.js";
import { EmailSubjectEnum } from "../../common/enum/email.enum.js";
import {
  del,
  expire,
  get,
  incrBy,
  keys,
  set,
  ttl,
} from "../../common/services/cache.service.js";
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
const sendEmailOtp = async ({
  email,
  subject,
  expiersIn = 120,
  maxTrials = 3,
  blockInSeconds = 300,
}) => {
  const existOtp_TTl = await ttl({ key: userEmailKey({ email, subject }) });
  if (existOtp_TTl > 0) {
    throw ConflictException({ message: `try again after ${existOtp_TTl}s` });
  }
  const oldTrials =
    (await get({ key: userEmailTrialsKey({ email, subject }) })) ?? 0;
  if (oldTrials >= maxTrials) {
    throw TooManyRequestsException({
      message: "maximum otp trials has been reached try again after 24 hours",
    });
  }
  const code = createOtp();
  await set({
    key: userEmailKey({ email, subject }),
    value: await hash(code.toString()),
    ttl: expiersIn,
  });
  const currentTrials = await incrBy({
    key: userEmailTrialsKey({ email, subject }),
  });
  if (currentTrials == maxTrials) {
    await expire({
      key: userEmailTrialsKey({ email, subject }),
      ttl: blockInSeconds,
    });
  }
  emailEvent.emit("sendEmail", {
    recipients: { to: email },
    subject,
    data: { code, title: subject },
  });
};
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
  await sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL });
  return account;
};

export const confirmEmail = async ({ otp, email }) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });
  if (!account) throw NotFoundException({ message: "invalid account" });
  const hashOtp = await get({
    key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    ConflictException({ message: "invalid otp" });
  }
  account.confirmEmail = new Date();
  await account.save();
  await del({
    key: await keys({
      prefix: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
    }),
  });
  return account;
};
export const resendConfirmEmail = async ({ email }) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });
  if (!account) throw NotFoundException({ message: "invalid account" });
  await sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL });
  return;
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

export const login = async (
  { email, password },
  issuer,
  maxTrials = 5,
  blockInSeconds = 300,
) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });
  if (!account) throw NotFoundException({ message: "user not found" });
  const match = await compare(password, account.password);

  if (!match) {
    const oldTrials =
      (await get({ key: `User${email}::password::trial` })) ?? 0;
    if (oldTrials >= maxTrials) {
      throw TooManyRequestsException({
        message:
          "maximum password trials has been reached try again after 5 minutes",
      });
    }
    const currentTrials = await incrBy({
      key: `User${email}::password::trial`,
    });
    if (currentTrials == maxTrials) {
      await expire({
        key: `User${email}::password::trial`,
        ttl: blockInSeconds,
      });
    }
    throw NotFoundException({ message: "incorrect password" });
  }

  if (account.confirm2fa) {
    await sendEmailOtp({ email, subject: EmailSubjectEnum.STEP_VERIFICATION });
    return;
  }
  await del({ key: `User${email}::password::trial` });
  return await createLoginCredintials({ user: account, issuer });
};

export const enable2Fa = async ({ email, password }) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });
  if (!account) throw NotFoundException({ message: "user not found" });
  const match = await compare(password, account.password);

  if (!match) {
    const oldTrials =
      (await get({ key: `User${email}::password::trial` })) ?? 0;
    if (oldTrials >= maxTrials) {
      throw TooManyRequestsException({
        message:
          "maximum password trials has been reached try again after 5 minutes",
      });
    }
    const currentTrials = await incrBy({
      key: `User${email}::password::trial`,
    });
    if (currentTrials == maxTrials) {
      await expire({
        key: `User${email}::password::trial`,
        ttl: blockInSeconds,
      });
    }
    throw NotFoundException({ message: "incorrect password" });
  }
  await del({ key: `User${email}::password::trial` });
  await sendEmailOtp({ email, subject: EmailSubjectEnum.STEP_VERIFICATION });
  return;
};

export const verifyEnable2fa = async ({ otp, email }) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirm2fa: { $exists: false },
    },
  });
  if (!account) throw NotFoundException({ message: "invalid account" });
  const hashOtp = await get({
    key: userEmailKey({ email, subject: EmailSubjectEnum.STEP_VERIFICATION }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    ConflictException({ message: "invalid otp" });
  }
  account.confirm2fa = new Date();
  await account.save();
  await del({
    key: await keys({
      prefix: userEmailKey({
        email,
        subject: EmailSubjectEnum.STEP_VERIFICATION,
      }),
    }),
  });
  return account;
};
export const resendVerifyEnable2fa = async ({ email }) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });
  if (!account) throw NotFoundException({ message: "invalid account" });
  await sendEmailOtp({ email, subject: EmailSubjectEnum.STEP_VERIFICATION });
  return;
};

export const confirmlogin = async ({ otp, email }, issuer) => {
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirm2fa: { $exists: true },
    },
  });
  if (!account) throw NotFoundException({ message: "invalid account" });
  const hashOtp = await get({
    key: userEmailKey({ email, subject: EmailSubjectEnum.STEP_VERIFICATION }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    ConflictException({ message: "invalid otp" });
  }
  await del({
    key: await keys({
      prefix: userEmailKey({
        email,
        subject: EmailSubjectEnum.STEP_VERIFICATION,
      }),
    }),
  });
  return await createLoginCredintials({ user: account, issuer });
};
