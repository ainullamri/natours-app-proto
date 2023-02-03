// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create transporter
  // FOR DEVELOPMENT TEMPORARLY USING MAILTRAP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define options for email
  const mailOptions = {
    from: "Ainul <dummy-email@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  // 3) Actually send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
