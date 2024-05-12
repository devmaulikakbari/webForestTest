const router = require("express").Router();
const userController = require("../../controllers/User/user.controller");
const validateToken = require("../../middleware/auth.middleware");
const validator = require("../../middleware/validator.middleware");
const bodyvalidator = require("../../middleware/schemaValidation.middleware");

router.post(
  "/user/signup",
  validator(bodyvalidator.isUserSchema, "body"),
  userController.signUp
);
router.post(
  "/user/login",
  validator(bodyvalidator.isLoginSchema, "body"),
  userController.login
);
router.post(
  "/user/verifyotp",
  validator(bodyvalidator.isOtpVerifySchema, "body"),
  userController.verifyOTP
);
router.get(
  "/user-repo/:username",
  validateToken,
  validator(bodyvalidator.getUserRepo, "params"),
  userController.getUserRepository
);
router.post(
  "/favorite",
  validateToken,
  validator(bodyvalidator.favouriteSchema, "body"),
  userController.addAndRemoveFavourite
);
router.get(
  "/favorite",
  validateToken,
  userController.getallFavorite
);
module.exports = router;
