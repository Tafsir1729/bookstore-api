const { Router } = require("express");
const cors = require("cors");
const { register, verifyOTP, login } = require("./user.controller");
const { registerValidator } = require("./user.validator");

const serverUrl = "http://localhost:3000";

const router = Router();

router.post(
  "/user/register",
  cors({
    origin: serverUrl,
    optionsSuccessStatus: 201,
  }),
  registerValidator,
  register
);

router.post(
  "/user/verifyOTP",
  cors({
    origin: serverUrl,
    optionsSuccessStatus: 200,
  }),
  verifyOTP
);

router.post(
  "/user/login",
  cors({
    origin: serverUrl,
    optionsSuccessStatus: 200,
  }),
  login
);

module.exports = router;
