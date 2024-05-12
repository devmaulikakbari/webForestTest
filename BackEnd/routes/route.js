exports.setup = function (app) {
  const userDetail = require("./user/user.routes");
  app.use("/api", userDetail);
};

module.exports = exports;
