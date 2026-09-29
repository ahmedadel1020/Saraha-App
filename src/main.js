import { port } from "../config/config.service.js";
import { decrypt, encryption } from "./common/security/encryption.security.js";
import { testConnection } from "./DB/connection.db.js";
import { globalErrorHandling } from "./middleware/index.js";
import { authRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";

const app = express();

//convert buffer data
app.use(cors(), express.json());
await testConnection(app, port);

//application routing
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/auth", authRouter);
app.use("/user", userRouter);

//invalid routing
app.all("{/*dummy}", (req, res) => {
  return res.status(404).json({ message: "Invalid application routing" });
});

//error-handling
app.use(globalErrorHandling);
