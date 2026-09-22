import { Router } from "express";
import { login, signup } from "./auth.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";

const router = Router();
router.post("/signup", async (req, res, next) => {
  const data = await signup(req.body);
  return successResponse({ res, status: 201, data });
});

router.post("/login", async (req, res, next) => {
  const data = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, status: 201, data });
});

export default router;
