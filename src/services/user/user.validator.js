const joi = require("joi");
const { response } = require("../../utils/response");
const { StatusCodes } = require("http-status-codes");

const validator = joi.object({
  fullName: joi.string().max(50).required(),
  email: joi.string().email().trim(true).required(),
  password: joi.string().min(8).trim(true).required(),
  phone: joi
    .string()
    .length(14)
    .pattern(/(^(\+8801|8801|01|008801))[1|3-9]{1}(\d){8}$/)
    .required(),
  mimetype: joi.string().valid("image/jpeg", "image/png").required(),
  size: joi.number().max(5242880).required(),
  gender: joi.string().required(),
  role: joi.string().required(),
  active: joi.boolean().default(true),
});

const registerValidator = async (req, res, next) => {
  const data = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    mimetype: req.files?.photo?.mimetype,
    size: req.files?.photo?.size,
    gender: req.body.gender,
    role: req.body.role,
    active: req.body.active,
  };
  const { error } = validator.validate(data);
  if (error) {
    let msg = `Error in Data : ${error.message}`;
    return response(res, StatusCodes.NOT_ACCEPTABLE, false, {}, msg);
  } else {
    next();
  }
};
module.exports = { registerValidator };
