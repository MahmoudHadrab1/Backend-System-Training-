const Joi = require('joi');
const ApiError = require('../utils/apiError');

const validate = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    
    // Update req.body with validated value
    req.body = value;
    next();
  };
};

module.exports = { validate };