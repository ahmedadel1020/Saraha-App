import { LanguageEnum } from "../common/enum/security.enum.js";
import { BadRequestException } from "../common/exceptions/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const lang = Number(req.headers["accept-language"] ?? LanguageEnum.EN);
    const validationres = schema(lang).safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!validationres.success)
      throw BadRequestException({
        message: `validatin error :: ${validationres.error}`,
        extra: validationres.error.issues,
      });
    req.validate = validationres.data;
    next();
  };
};
