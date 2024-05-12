const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  user_name: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true
  },
  email: {
    type: String,
  },
  login_token: {
    type: String,
  },
});

const userDetail = new mongoose.model("UserDetail", userSchema);
module.exports = userDetail;
