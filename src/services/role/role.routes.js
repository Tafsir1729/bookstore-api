const { Router } = require("express");
const { create, getAll } = require("./role.controller");
const cors = require("cors");

const router = Router();
router.post(
  "/role/create",
  cors({
    origin: "http://localhost:5000",
    optionsSuccessStatus: 201,
  }),
  create
);
router.get("/role/get", getAll);

module.exports = router;
