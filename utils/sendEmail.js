// Import the Nodemailer library
const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Sends an email based on the provided mail options.
 * @param {Object} mailOptions - Options for the email (to, subject, html content, etc.)
 * @returns {Promise} - Promise representing the result of the sendMail operation.
 */
const sendEmail = async (mailOptions) => {
  try {
    // Create the transporter using environment variables for SMTP configuration
    const transporter = nodemailer.createTransport({
      // service: 'gmail',
      host: process.env.SMTP_HOST, // SMTP host from environment variables
      port: process.env.SMTP_PORT, // SMTP port from environment variables
      auth: {
        user: process.env.SMTP_USER, // SMTP username from environment variables
        pass: process.env.SMTP_PASS, // SMTP password from environment variables
      },
    });

    // Send the email using the transporter and provided mail options
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${mailOptions.to}`); // Log the email send status
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email"); // Throw error if email fails
  }
};

module.exports = sendEmail;
