const { hash } = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const { User } = require("./user.model");
const { response } = require("../../utils/response");
const { logger } = require("../../utils/logger");
const { BLOB_URL, BLOB_CONTAINER_NAME, BLOB_CONNECTION_STRING } = process.env;
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");
const { sendEmail } = require("../../utils/sendGrid");
const { createToken } = require("../../utils/protected");

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
      logger.error(`Couldn't create user ${email}`, {
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
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user.otp === otp && user.otpExpiry >= new Date()) {
      return response(
        res,
        StatusCodes.OK,
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
      await User.deleteOne({ email: email });
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
    await User.deleteOne({ email: email });
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    let msg = "Please provide email and password.";
    return response(res, StatusCodes.BAD_REQUEST, false, {}, msg);
  }

  try {
    const user = await User.findOne({
      email: email,
    });
    if (!user) {
      let msg = "No user found!";
      return response(res, StatusCodes.NOT_FOUND, false, {}, msg);
    }

    const passwordMatched = await compare(password, user.password);
    if (passwordMatched) {
      if (user.active) {
        const token = await createToken(user);
        if (token) {
          return response(res, StatusCodes.OK, true, { token: token }, null);
        }
        let msg = "Could not generate token!";
        logger.error(`Could not generate token for user ${email}`, {
          service: "user",
          controller: "user",
          method: "login",
        });
        return response(res, StatusCodes.BAD_REQUEST, false, {}, msg);
      } else {
        let msg = "User is not active!";
        return response(res, StatusCodes.NOT_ACCEPTABLE, false, {}, msg);
      }
    } else {
      let msg = "Incorrect password!";
      return response(res, StatusCodes.NOT_ACCEPTABLE, false, {}, msg);
    }
  } catch (error) {
    logger.error(error.message, {
      service: "user",
      controller: "user",
      method: "login",
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

module.exports = { register, verifyOTP, login };
