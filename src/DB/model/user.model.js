import mongoose from "mongoose";
import { GenderEnum, RoleEnum } from "../../common/enum/index.js";

const userschema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      minlenght: 2,
      maclength: 25,
      required: true,
    },
    lastName: {
      type: String,
      minlenght: 2,
      maclength: 25,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: String,
    DOB: Date,
    confirmEmail: Date,
    image: String,
    coverImage: String,
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
  },
);

userschema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const userModel =
  mongoose.models.user || mongoose.model("user", userschema);
