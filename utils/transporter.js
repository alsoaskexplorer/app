// Import the Nodemailer library
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter based on environment
const isProduction = process.env.NODE_ENV === "production";

const transporter = nodemailer.createTransport({
  host: isProduction ? "smtp.gmail.com" : "sandbox.smtp.mailtrap.io",
  port: isProduction ? 587 : 2525,
  secure: isProduction, // use SSL for Gmail, otherwise false for Mailtrap
  auth: {
    user: process.env.EMAIL_USER, // Move email and password to .env file
    pass: process.env.EMAIL_PASS,
  },
})
