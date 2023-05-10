const { StatusCodes } = require("http-status-codes");
const { verify } = require("jsonwebtoken");
const { response } = require("./response");
const { sign } = require("jsonwebtoken");
const { logger } = require("./logger");
const { User } = require("../services/user/user.model");
const { Role } = require("../services/role/role.model");

const config = {
  secrets: {
    jwt: "PJaHvt8ASQvFgSgYI2gyc8a9TdHzLh5Rx98s7aB4nhUz4rvW92zsKvN6zbPIub",
    jwtExp: "30d",
  },
};

const createToken = (user) => {
  return sign(
    {
      _id: user._id,
      email: user.email,
      photo: user.photoUrl,
      name: user.fullName,
      userType: user.role,
    },
    config.secrets.jwt,
    {
      expiresIn: config.secrets.jwtExp,
    }
  );
};

const verifyToken = async (token) => {
  if (!token) return;
  const payload = await verify(token, config.secrets.jwt);
  const user = await User.findById(payload._id);
  try {
    if (user) return user;
    else return;
  } catch (error) {
    logger.error(`Token verification failed for: ${user.email}`, {
      service: "",
      controller: "",
      method: "verifyToken",
    });
    return;
  }
};

const isUser = async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const user = await verifyToken(
        req.headers.authorization.split("Bearer ")[1],
        req
      );
      const userRole = await Role.findById(user.role);
      if (user && userRole === "User") {
        req.user = user;
        next();
      } else {
        return response(
          res,
          StatusCodes.BAD_REQUEST,
          false,
          {},
          "Not Authenticated"
        );
      }
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        err,
        err.message
      );
    }
  } else {
    return response(
      res,
      StatusCodes.NOT_ACCEPTABLE,
      false,
      {},
      "Authentication token not found!"
    );
  }
};

const isAdmin = async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const user = await verifyToken(
        req.headers.authorization.split("Bearer ")[1],
        req
      );
      const userRole = await Role.findById(user.role);
      if (user && userRole === "Admin") {
        req.user = user;
        next();
      } else {
        return response(
          res,
          StatusCodes.NOT_FOUND,
          false,
          {},
          "Not Authenticated"
        );
      }
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        err,
        err.message
      );
    }
  } else {
    return response(
      res,
      StatusCodes.NOT_ACCEPTABLE,
      false,
      {},
      "Authentication token not found!"
    );
  }
};

module.exports = { createToken, isUser, isAdmin, verifyToken };
