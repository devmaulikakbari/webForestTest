const otpSchema = require("../../models/otp.model");

exports.createOtp = async (otp) => {
  try {
    const otpData = new otpSchema(otp);
    await otpData.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.updateOTP = async (updateData, whereCondition) => {
  try {
    await otpSchema.updateMany(
      whereCondition,
      { $set: updateData }
    );
  } catch (err) {
    throw new Error(err);
  }
};

exports.getOTP = async (whereCondition) => {
  try {
    return await otpSchema.findOne(whereCondition);
  } catch (err) {
    throw err;
  }
};