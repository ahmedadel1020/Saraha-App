import crypto from "node:crypto";
import { ENC_KEY, IV_LENGTH } from "../../../config/config.service.js";
import { buffer } from "node:stream/consumers";

export const encryption = async (plaintext) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_KEY, iv);
  let encryptdata = cipher.update(plaintext, "utf-8", "hex");
  encryptdata += cipher.final("hex");
  console.log(encryptdata);
  return `${iv.toString("hex")}::${encryptdata}`;
};

export const decrypt = (ciphertext) => {
  const [iv, encryptdata] = ciphertext.split("::");
  const iv_vector = Buffer.from(iv, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENC_KEY, iv_vector);
  let decrypted = decipher.update(encryptdata, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
