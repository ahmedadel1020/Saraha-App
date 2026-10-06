import { Router } from "express";
import {
  confirmEmail,
  confirmlogin,
  enable2Fa,
  login,
  resendConfirmEmail,
  resendVerifyEnable2fa,
  signup,
  signupWithGmail,
  verifyEnable2fa,
} from "./auth.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
const router = Router();

router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const data = await confirmEmail(req.validate.body);
    return successResponse({ res, status: 200, data });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const data = await resendConfirmEmail(req.validate.body);
    return successResponse({ res, status: 200, data });
  },
);

router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const data = await signup(req.validate);
    console.log(data);
    return successResponse({ res, status: 201, data });
  },
);
router.post("/signup-with-gmail", async (req, res, next) => {
  const { status, data } = await signupWithGmail(
    req.body,
    `${req.protocol}://${req.host}`,
  );
  return successResponse({ res, status, data });
});

router.post("/login", validation(validators.login), async (req, res, next) => {
  const data = await login(req.validate.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, status: 201, data });
});

router.post("/2fa", validation(validators.login), async (req, res, next) => {
  const data = await enable2Fa(req.validate.body);
  return successResponse({ res, status: 201, data });
});

router.patch(
  "/confirm-2fa",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const data = await verifyEnable2fa(req.validate.body);
    return successResponse({ res, status: 200, data });
  },
);

router.patch(
  "/resend-confirm-2fa",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const data = await resendVerifyEnable2fa(req.validate.body);
    return successResponse({ res, status: 200, data });
  },
);

router.patch(
  "/confirm-login",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const data = await confirmlogin(
      req.validate.body,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({ res, status: 200, data });
  },
);

export default router;
