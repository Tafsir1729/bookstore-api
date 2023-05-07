const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, from, subject, body) => {
  const msg = {
    to,
    from,
    subject,
    text: body,
    html: body,
  };

  try {
    const response = await sgMail.send(msg);
    if (response[0].statusCode === 202) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = { sendEmail };
