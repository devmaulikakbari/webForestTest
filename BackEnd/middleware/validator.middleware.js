const { ValidationError } = require("joi");

const validator = (schema, path, statusCode = 400) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[path], { abortEarly: false });

    if (error instanceof ValidationError) {
      return res.status(statusCode).json({
        code: statusCode,
        status: false,
        message: error.message,
      });
    }

    next();
  };
};

module.exports = validator;
