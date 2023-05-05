const { StatusCodes } = require("http-status-codes");
const { response } = require("../../utils/response");
const { Role } = require("./role.model");

const create = async (req, res) => {
  const { name } = req.body;
  if (!name)
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      null,
      "Role name is required!"
    );
  try {
    const duplicateRole = await Role.findOne({
      name: name,
    });
    if (duplicateRole)
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "Role already exists!"
      );
    const newRole = await Role.create({
      name: name,
    });
    if (!newRole)
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        "Couldn't create role!"
      );
    return response(res, StatusCodes.CREATED, true, { role: newRole }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const getAll = async (req, res) => {
  try {
    const roles = await Role.find().select("name");
    if (roles.length === 0)
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        null,
        "No roles found!"
      );
    return response(res, StatusCodes.OK, true, { roles: roles }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};
module.exports = { create, getAll };
