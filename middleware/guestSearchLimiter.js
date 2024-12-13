// const rateLimit = require('express-rate-limit');

// // Define the rate limit for guests
// exports.guestSearchLimiter = rateLimit({
//   // windowMs: 15 * 60 * 1000, // 15 minutes
//   windowMs: 24 * 60 * 60 * 1000, // 24 hours
//   max: 5, // Limit each IP to 5 search requests per `window` (15 minutes)
//   message: { message: 'Guest search limit reached. Try again later.' },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });



const rateLimit = require('express-rate-limit');
const User = require("../models/user"); // Assuming your User model is in models/User.js

// Middleware to get rate limit for guests dynamically from the User table
exports.guestSearchLimiter = async (req, res, next) => {
  try {
    // Fetch the limit from the User model (you could also get it from a global setting or other source)
    const user = await User.findOne({ email: req.body.email }); // Or any condition for finding a user
    const limit = user ? user.limit : 5; // Default to 5 if no user or limit is not found

    // Apply the rate limit based on the retrieved limit
    const limiter = rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: limit, // Use the dynamic limit from the user or 5 if not found
      message: { message: 'Guest search limit reached. Try again later.' },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    // Run the rate limiter
    limiter(req, res, next);
  } catch (error) {
    console.error('Error fetching user limit:', error);
    // Fallback to default rate limiting if an error occurs
    const fallbackLimiter = rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // Default limit if there's an error fetching the user data
      message: { message: 'Guest search limit reached. Try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    fallbackLimiter(req, res, next);
  }
};
