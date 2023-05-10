const { Router } = require("express");
const { create, getAll } = require("./role.controller");
const cors = require("cors");
const { isAdmin } = require("../../utils/protected");

const serverUrl = "http://localhost:5000";

const router = Router();

router.post(
  "/role/create",
  cors({
    origin: serverUrl,
    optionsSuccessStatus: 201,
  }),
  isAdmin,
  create
);

router.get(
  "/role/get",
  cors({
    origin: serverUrl,
    optionsSuccessStatus: 200,
  }),
  isAdmin,
  getAll
);

module.exports = router;
