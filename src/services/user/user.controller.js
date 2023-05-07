const { hash } = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const { User } = require("./user.model");
const { response } = require("../../utils/response");
const { logger } = require("../../utils/logger");
const { BLOB_URL, BLOB_CONTAINER_NAME, BLOB_CONNECTION_STRING } = process.env;
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");
const { sendEmail } = require("../../utils/sendGrid");

const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, role } = req.body;

    const duplicateUser = await User.findOne({
      email: email,
    });
    if (duplicateUser) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "User already exists!"
      );
    }

    // Upload file in azure blob storage
    const file = req.files?.photo;
    let blobResponse = await uploadToBlob(file);

    const hashedPassword = await hash(password, 9);
    let newUser = await User.create({
      fullName: fullName,
      email: email,
      password: hashedPassword,
      phone: phone,
      gender: gender,
      role: role,
      active: true,
      photoUrl: blobResponse,
    });
    if (!newUser) {
      logger.error(`Couldn't create user ${email}!`, {
        service: "user",
        controller: "user",
        method: "register",
      });
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        "Couldn't create user!"
      );
    }

    //OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    Date.prototype.addMinutes = function (minutes) {
      let date = new Date();
      date.setMinutes(date.getMinutes() + minutes);
      return date;
    };
    let date = new Date();
    const expires = date.addMinutes(5);
    newUser = await User.updateOne(
      { email: email },
      { $set: { otp: otp, otpExpiry: expires } }
    );

    let emailResponse = await sendOTP(email, otp, expires);
    if (!emailResponse) {
      logger.error(`Couldn't send otp to user ${email}!`, {
        service: "user",
        controller: "user",
        method: "register",
      });
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Couldn't send otp!"
      );
    }

    return response(res, StatusCodes.CREATED, true, null, null);
  } catch (error) {
    logger.error(error.message, {
      service: "user",
      controller: "user",
      method: "register",
    });
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const uploadToBlob = async (file) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      BLOB_CONNECTION_STRING
    );
    const containerClient =
      blobServiceClient.getContainerClient(BLOB_CONTAINER_NAME);
    const fileFormat = file.name.split(".").pop();
    const blobOptions = {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    };
    const blobName = uuidv4() + "." + fileFormat;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const blobResponse = await blockBlobClient.upload(
      file.data,
      file.data.length,
      blobOptions
    );
    if (!blobResponse) {
      logger.error("Failed to upload file in blob storage!", {
        service: "user",
        controller: "user",
        method: "uploadToBlob",
      });
      return null;
    }
    return BLOB_URL + blobName;
  } catch (error) {
    logger.error(error.message, {
      service: "user",
      controller: "user",
      method: "uploadToBlob",
    });
    return null;
  }
};

const sendOTP = async (toEmail, otp, expires) => {
  let body = `<div>
  <div>
  <p style="font-family: arial, sans-serif;">
  Dear User,
  </p>
  <p style="font-family: arial, sans-serif;">
  Here is your OTP: ${otp}.
  </p>
  <p style="font-family: arial, sans-serif;">
  It will expire in ${expires}.
  </p>
  </div>
  <div>
  <p style="font-family: arial, sans-serif;">
  Best Regards,
  <br/>
  Admin
  </p>
  </div>
  </div>`;
  return await sendEmail(
    toEmail,
    "no-reply@ncc.se",
    "OTP for verification",
    body
  );
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email });
    if (user.opt === otp && user.otpExpiry >= new Date()) {
      return response(
        res,
        StatusCodes.Ok,
        true,
        { user: user },
        "OTP verified successfully!"
      );
    } else {
      logger.error(`OTP verification failed for user ${email}`, {
        service: "user",
        controller: "user",
        method: "verifyOTP",
      });
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        { user: user },
        "OTP verification failed!"
      );
    }
  } catch (error) {
    logger.error(error.message, {
      service: "user",
      controller: "user",
      method: "verifyOTP",
    });
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

module.exports = { register, verifyOTP };
