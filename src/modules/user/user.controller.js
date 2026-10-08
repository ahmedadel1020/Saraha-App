import { tokenTypeEnum } from "../../common/enum/security.enum.js";
import {
  fileValidation,
  localFileUpload,
  processMulterUpload,
} from "../../common/utils/multer/local.multer.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { logout, profile, rotateToken, update } from "./user.service.js";
import { Router } from "express";
const router = Router();

router.patch(
  "/profile-image",
  authentication(),
  localFileUpload({
    maxFileSize: 5,
    validation: fileValidation.image,
  }).single("attachments"),
  processMulterUpload({ validation: fileValidation.image }),
  async (req, res, next) => {
    req.user.image = req.file.finalPath;
    await req.user.save();
    return successResponse({ res, data: { user: req.user } });
  },
);

router.get("/", authentication(), async (req, res, next) => {
  const data = await profile(req.user);
  return successResponse({ res, data });
});

router.patch("/", authentication(), async (req, res, next) => {
  const data = await update(req.user, req.body);
  return successResponse({ res, data });
});
router.post(
  "/rotate-token",
  authentication(tokenTypeEnum.REFREH),
  async (req, res, next) => {
    const data = await rotateToken(
      req.payload,
      req.user,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({ res, data });
  },
);

router.post("/logout", authentication(), async (req, res, next) => {
  const data = await logout(req.payload, req.user, req.body);
  return successResponse({ res, data });
});
export default router;
