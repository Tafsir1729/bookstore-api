const { Router } = require("express");
const cors = require("cors");
const { register, verifyOTP } = require("./user.controller");
const { registerValidator } = require("./user.validator");

const router = Router();
router.post(
  "/user/register",
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: 201,
  }),
  registerValidator,
  register
);
router.post(
  "/user/verifyOTP",
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
  }),
  verifyOTP
);

module.exports = router;
