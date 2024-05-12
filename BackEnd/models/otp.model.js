const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    unique: true,
  },
  expireTime: {
    type: Date,
  },
  otp_status: {
    type: String,
    enum: ["send", "verify", "expire"],
  },
});

const otp = new mongoose.model("Otp", otpSchema);
module.exports = otp;
