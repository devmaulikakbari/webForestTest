const userSchema = require("../../models/user.model");

exports.createUserData = async (userDetail) => {
  try {
    const detail = await new userSchema(userDetail);
    return await detail.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.getUser = async (whereCondition) => {
  try {
    const findUser = await userSchema.findOne(whereCondition);
    return findUser;
  } catch (err) {
    throw err;
  }
};

exports.updatePassword = async (updateData, whereCondition) => {
  try {
    const updateUserPass = await userSchema.updateMany(whereCondition, {
      $set: updateData,
    });
    return updateUserPass;
  } catch (err) {
    throw new Error(err);
  }
};

exports.createLoginData = async (userData, tokon) => {
  try {
    await userSchema.updateMany(
      { email: userData.email },
      { $set: { login_token: tokon } }
    );
  } catch (err) {
    throw new Error(err);
  }
};