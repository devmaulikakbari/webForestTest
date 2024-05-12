const Joi = require("joi");

const isUserSchema = Joi.object().keys({
  user_name: Joi.string().required().error(new Error("User Name Is Require.")),
  password: Joi.string().required(),
  email: Joi.string()
    .email()
    .required()
    .error(
      () =>
        new Error("Invalid email format. Please enter a valid email address.")
    ),
});

const isLoginSchema = Joi.object().keys({
  email: Joi.string()
    .email()
    .required()
    .error(
      () =>
        new Error("Invalid email format. Please enter a valid email address.")
    ),
  password: Joi.string().required(),
});

const isOtpVerifySchema = Joi.object().keys({
  otp: Joi.string().required(),
  token: Joi.string().required(),
});

const favouriteSchema = Joi.object().keys({
  repoId: Joi.number().required(),
});

const getUserRepo = Joi.object().keys({
  username: Joi.string().required(),
});

module.exports = {
  isUserSchema,
  isLoginSchema,
  isOtpVerifySchema,
  getUserRepo,
  favouriteSchema
};
