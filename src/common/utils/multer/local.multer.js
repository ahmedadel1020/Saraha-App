import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/gif"],
  files: ["application/pdf", "application/json"],
};
import { BadRequestException } from "../../exceptions/index.js";
export const localFileUpload = ({ maxFileSize = 5, validation = [] } = {}) => {
  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, "./assets");
  //   },
  //   filename: function (req, file, cb) {
  //     cb(null, randomUUID() + file.originalname);
  //   },
  // });
  const storage = multer.memoryStorage();
  function fileFilter(req, file, cb) {
    console.log(file.mimetype);
    if (validation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("invalid format", { cause: { status: 400 } }), false);
    }
  }
  return multer({
    fileFilter,
    storage,
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
};

export const processFile = async ({
  customPath = "general",
  file,
  validation = [],
}) => {
  const result = await fileTypeFromBuffer(file.buffer);
  if (!result || !validation.includes(result.mime)) {
    throw BadRequestException({ message: "invalid file format" });
  } else {
    await mkdir(resolve(`./assets/${customPath}`), { recursive: true });
    const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;

    await writeFile(resolve(`./${uniqueFilePath}`), file.buffer);
    file.finalPath = uniqueFilePath;
    return file;
  }
};

export const processFiles = async ({
  customPath,
  files = [],
  validation = [],
}) => {
  const assets = [];
  for (const file of files) {
    const uploadfile = await processFile({ customPath, file, validation });
    assets.push(uploadfile);
  }
  return assets;
};

export const processFields = async ({
  customPath,
  fields = {},
  validation = [],
}) => {
  const assets = [];
  for (const field of Object.keys(fields)) {
    const files = await processFiles({
      customPath,
      files: fields[field],
      validation,
    });
    assets.push({ field, files });
  }
  return assets;
};

export const processMulterUpload = ({
  customPath = "general",
  validation = [],
}) => {
  return async (req, res, next) => {
    if (req.file) {
      await processFile({ customPath, file: req.file, validation });
    } else if (Array.isArray(req.files)) {
      await processFiles({ customPath, files: req.files, validation });
    } else if (typeof req.files == "object" && Object.keys(req.files)?.length) {
      await processFields({ customPath, fields: req.files, validation });
    }
    next();
  };
};

/*

export const processFile = ({ validation = [] }) => {
  return async (req, res, next) => {
    const filePath = resolve(`./${file.path}`);
    const fileBuffer = await readFile(filePath);
    const result = await fileTypeFromBuffer(fileBuffer);

    if (!result || !validation.includes(result.mime)) {
      await unlink(filePath);
      next(new Error("invalid file format", { cause: { status: 400 } }));
    }
    next();
  };
};

*/
