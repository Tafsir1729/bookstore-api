const nodemailer = require("nodemailer");
const { GMAIL_USERNAME, GMAIL_PASSWORD } = process.env;

const sendEmail = async (mailOptions) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USERNAME,
      pass: GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions, function (error) {
    if (error) {
      // const errorResponse = error.message;
      return false;
    } else {
      // const response = info.response;
      return true;
    }
  });
};

module.exports = { sendEmail };
