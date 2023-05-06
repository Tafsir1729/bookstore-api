const { Schema, model, SchemaTypes } = require("mongoose");

const UserSchema = Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    role: {
      type: SchemaTypes.ObjectId,
      ref: "role",
    },
    photoUrl: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = model("user", UserSchema);
module.exports = { User };
