const { body, param, validationResult } = require("express-validator");

const validateBookTicket = [
  body("name").isString().withMessage("Name must be a string"),
  body("age")
    .isInt({ min: 0 })
    .withMessage("Age must be a non-negative integer"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];

const validateCancelTicket = [
  param("ticketId").isInt().withMessage("Ticket ID must be an integer"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateBookTicket,
  handleValidationErrors,
  validateCancelTicket,
};
