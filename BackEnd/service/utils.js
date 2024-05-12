var CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const encryptionKey = process.env.UI_DECRYPT_KEY;


exports.encryptedData = (password) => {
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    encryptionKey
  ).toString();
  return encryptedPassword;
};

exports.generateOTP = () => {
  var minm = 100000;
  var maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
};

exports.generateTokenId = () => {
  return uuidv4();
};

exports.sendMail = async (to, subject, html) => {
  let mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    service : "gmail",
    secure: false,
    auth: {
      pass: process.env.MAIL_PASSWORD,
      user: process.env.MAIL_EMAIL_ID,
    },
  });

  let mailDetails = {
    from: process.env.MAIL_EMAIL_ID,
    to,
    subject,
    html,
  };

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("Error Occurs", err);
    } else {
      console.log("Email sent successfully");
    }
  });
};

exports.createToken = (user, secretKey) => {
  return jwt.sign(
    {
      name: user.user_name,
      login_token: user.login_token,
      email: user.email,
    },
    secretKey,
    {
      expiresIn: "30d",
    }
  );
};

exports.decryptPassword = (password) => {
  const decryptedBytes = CryptoJS.AES.decrypt(password, encryptionKey);
  const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedPassword;
};