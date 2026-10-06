import { z } from "zod";
import { GenderEnum, LanguageEnum } from "./enum/index.js";
const matchFields = ({ original, copy, data, ctx, lang }) => {
  if (data[original] != data[copy]) {
    ctx.addIssue({
      message:
        lang == LanguageEnum.AR
          ? `فشل التطابق بين ${original} و ${copy}`
          : `${original} is mismatched with ${copy}`,
      code: "custom",
      path: [copy],
    });
  }
};
export const generalValidationFields = {
  email: (lang) => z.email({ message: "invalid email format" }),
  password: (lang) =>
    z
      .string()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,16}$/)
      .min(8)
      .max(16),
  username: (lang) =>
    z
      .string()
      .min(2, {
        message:
          lang == LanguageEnum.AR
            ? "عفوا لا يمكن ادخال اسم المستخدم اقل من حرفين"
            : "minimum charachters is 2",
      })
      .max(51),
  confirmPassword: (lang) => z.string().min(8).max(16),
  phone: (lang) => z.e164(),
  gender: (lang) => z.enum(GenderEnum),
  otp: (lang) => z.string().regex(/^\d{6}$/, { error: "invalid code" }),
  matchFields,
};
