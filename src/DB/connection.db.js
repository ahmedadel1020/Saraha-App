import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { userModel } from "./model/user.model.js";

export const testConnection = async (app, port) => {
  try {
    await mongoose.connect(DB_URI);
    await userModel.syncIndexes();
    console.log("db connect successfully");
    app.listen(port, () => console.log(`app is running on ${port}`));
  } catch (error) {
    console.log("failed to connect on DB");
    console.log(error);
  }
};
