import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

const envPath = {
  development: `.env.development`,
  production: `.env.production`,
};

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });

export const port = process.env.PORT ?? 7000;

export const DB_URI = process.env.DB_URI;
export const ENC_KEY = process.env.ENC_KEY;
export const IV_LENGTH = parseInt(process.env.IV_LENGTH ?? "16");
export const ACCESS_USER_TOKEN_SIGNATURE =
  process.env.ACCESS_USER_TOKEN_SIGNATURE;
export const ACCESS_TOKEN_EXPIERS_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIERS_IN ?? "1800",
);

export const REFRESH_USER_TOKEN_SIGNATURE =
  process.env.REFRESH_USER_TOKEN_SIGNATURE;
export const REFRESH_TOKEN_EXPIERS_IN = parseInt(
  process.env.REFRESH_TOKEN_EXPIERS_IN ?? "31536000",
);

export const ACCESS_ADMIN_TOKEN_SIGNATURE =
  process.env.ACCESS_ADMIN_TOKEN_SIGNATURE;
export const REFRESH_ADMIN_TOKEN_SIGNATURE =
  process.env.REFRESH_ADMIN_TOKEN_SIGNATURE;
