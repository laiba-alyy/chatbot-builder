// middleware/validation.js
// Generic request validation wrapper. Replace with express-validator or
// Joi/celebrate if you need real validation logic.

exports.validate = (schema) => (req, res, next) => {
  // schema could be a function that inspects req.body/query/params
  // for now assume everything is valid
  next();
};
