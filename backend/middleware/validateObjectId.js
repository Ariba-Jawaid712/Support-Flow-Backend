const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const idToValidate = req.params[paramName];
    if (idToValidate && !mongoose.Types.ObjectId.isValid(idToValidate)) {
      return res.status(400).json({
        success: false,
        message: `Invalid identifier format for parameter '${paramName}': ${idToValidate}`,
      });
    }
    next();
  };
};

module.exports = validateObjectId;
