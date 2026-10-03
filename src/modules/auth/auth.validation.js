import { z } from "zod";

import { generalValidationFields } from "../../common/validation.js";

export const loginSchema = (lang) => {
  return z.strictObject({
    email: generalValidationFields.email(lang),
    password: generalValidationFields.password(lang),
  });
};

export const login = (lang) => {
  return z.object({
    body: loginSchema(lang),
  });
};
export const signup = (lang) => {
  return z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields.username(lang),
        confirmPassword: generalValidationFields.confirmPassword(lang),
        phone: generalValidationFields.phone(lang),
        gender: generalValidationFields.gender(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.matchFields({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
        });
      }),
  });
};
