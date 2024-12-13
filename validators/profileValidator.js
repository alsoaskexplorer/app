const { body, validationResult } = require('express-validator');
const userModel = require('../models/user');
const { isISO8601, isMobilePhone, isPostalCode } = require('validator');

// Mock function for checking if email is unique
const isEmailUnique = async (email, currentEmail) => {
  const existingUser = await userModel.findOne({ email });
  return !existingUser || email === currentEmail; // Return true if email is unique or is the current email
};

// Helper function to convert empty strings to null
const convertEmptyStringToNull = (value) => {
  return value === '' ? null : value;
};

// Define validation rules
const profile_update_post = [
  // Name: Required and not empty
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .escape()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Email: Optional; if provided, must be a valid email format, and must be unique if different from current email
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const user = await userModel.findById(req.user.id);
      const currentEmail = user.email;

      // Check if the new email is unique
      const unique = await isEmailUnique(email, currentEmail);
      if (!unique) {
        throw new Error('Email already in use');
      }
      return true;
    })
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Country: Required and not empty
  body('country')
    .trim()
    .notEmpty().withMessage("Country is required")
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Gender: Optional but if present, must be either 'Male' or 'Female'
  body('gender')
    .optional()
    .trim()
    .isIn(['Male', 'Female']).withMessage('Gender must be either Male or Female')
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Date of Birth: Optional but must be a valid date format (ISO8601)
  body('dob')
    .optional({ nullable: true })
    .custom(value => !value || isISO8601(value)).withMessage('Date of birth must be a valid date')
    .toDate()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Phone: Optional but if provided, must be a valid mobile number
  body('phone')
    .optional({ nullable: true })
    .custom(value => !value || isMobilePhone(value, 'any')).withMessage('Valid mobile number is required')
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // OpenAI Key: Optional but if present, must be a non-empty string
  body('openAiKey')
    .optional({ nullable: true })
    .trim()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // State: Optional
  body('state')
    .optional()
    .trim()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // City: Optional
  body('city')
    .optional({ nullable: true })
    .trim()
    .escape()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Postcode: Optional but must be a valid postal code
  body('postcode')
    .optional({ nullable: true })
    .custom(value => !value || isPostalCode(value, 'any')).withMessage('Invalid postcode')
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Address Line: Optional
  body('addressLine')
    .optional({ nullable: true })
    .trim()
    .escape()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null

  // Domain: Optional but if provided, must be a valid URL
  body('domain')
    .optional({ nullable: true }) // Allow the field to be null
    .trim()
    .escape()
    .customSanitizer(convertEmptyStringToNull), // Convert empty string to null
];

// Error handling middleware
const validateProfileUpdate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.table(errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { profile_update_post, validateProfileUpdate };
