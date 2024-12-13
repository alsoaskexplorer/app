// Import Razorpay library for payment gateway integration
const Razorpay = require("razorpay");

// Initialize Razorpay instance using the Key ID and Secret from environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Razorpay Key ID (from .env)
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Razorpay Key Secret (from .env)
});

// Export the Razorpay instance to be used in other parts of the app
module.exports = razorpayInstance;
