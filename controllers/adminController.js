const asyncHandler = require("express-async-handler");
const userModel = require("../models/user");
const sendEmail = require('../utils/sendEmail');

exports.dashboard = asyncHandler(async (req, res) => {

  let users = await userModel.find().populate({ path: "subscriptions", populate: { path: "plan", select: "title description" }});

  let totalSubscriptions = 0; let monthlySubscriptions = 0; let lifetimeSubscriptions = 0;

  users.forEach(user => {
    user.subscriptions.forEach(subscription => {
      totalSubscriptions++; 

      if (subscription.plan.title.toLowerCase().includes("monthly")) { monthlySubscriptions++;} 
      else if (subscription.plan.title.toLowerCase().includes("lifetime")) { lifetimeSubscriptions++; } }); });

  res.render("admin/index", { totalSubscriptions, monthlySubscriptions, lifetimeSubscriptions, page : 'dashboard' });
});


exports.manageUsers = asyncHandler(async (req, res) => {
  let users = await userModel.find().populate({
    path: "subscriptions",
    populate: {
      path: "plan",
      select: "title description"
    },
  });

  res.render("admin/index", { users, page : 'manage-users' });

});


exports.creditLimit = async (req, res) => {
  try {
    const { email, amount } = req.body; // Receive email and amount from the request body

    // Log received values
    console.log("Credit Limit Request:", { email, amount });

    // Find the user by email
    const user = await userModel.findOne({ email }); // Find user using the email field
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the amount to the user's limit
    //   user.limit += amount;
    user.limit = amount;

    // Save the updated user object
    await user.save();

    // Log success
    console.log("Updated User Limit:", user.limit);

    return res
      .status(200)
      .json({ message: "Limit credited successfully", limit: user.limit });
  } catch (error) {
    // Log the error to help debugging
    console.error("Error crediting limit:", error);
    return res.status(500).json({ message: "Error crediting the limit" });
  }
};

// Controller function to send email
exports.sendPromotionEmail = async (req, res) => {
  const { email, name } = req.body;

  // Define the email HTML content
  const emailHtml = `
     <!DOCTYPE html>
<html>
<head>
  <title>Unlock the Full Power of Also Ask Explorer 🚀</title>
  <style>
      body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
      }
      .container {
          max-width: 600px;
          margin: auto;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
      }
      h1 {
          color: #0056b3;
      }
      .plan {
          margin: 20px 0;
      }
      .plan h2 {
          margin-bottom: 10px;
          color: #333;
      }
      .plan ul {
          margin: 0;
          padding-left: 20px;
      }
      .plan ul li {
          margin: 5px 0;
      }
      .cta-button {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #0056b3;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
      }
      .cta-button:hover {
          background-color: #003d7a;
      }
  </style>
</head>
<body>
  <div class="container">
      <p>Dear ${name},</p>
      <p>Thank you for exploring AlsoAskExplorer! We hope our tool has provided valuable insights during your free trial.</p>
      <p>To continue harnessing the full potential of AlsoAskExplorer, consider upgrading to one of our premium plans:</p>
      
      <div class="plan">
          <h2>Growth Plan</h2>
          <p><strong>Price:</strong> $9 per month</p>
          <ul>
              <li>Unlimited Searches</li>
              <li>Explore Deeper Related Questions</li>
              <li>SEO-Optimized AI-Powered Answers</li>
              <li>Exportable Data</li>
          </ul>
      </div>
      
      <div class="plan">
          <h2>Professional Plan</h2>
          <p><strong>Price:</strong> $79 one-time payment</p>
          <ul>
              <li>Unlimited Searches</li>
              <li>Explore Deeper Related Questions</li>
              <li>SEO-Optimized AI-Powered Answers</li>
              <li>Exportable Data</li>
          </ul>
      </div>
      
      <p>By upgrading, you'll unlock unlimited searches, deeper exploration of related questions, and the ability to export data—empowering your content strategy and SEO efforts.</p>
      <p><a href="https://www.alsoaskexplorer.com/explore-plans" class="cta-button">Upgrade Now</a></p>
      <p>If you have any questions or need assistance, feel free to reply to this email. We're here to help!</p>
      <p>Best regards,</p>
      <p>The AlsoAskExplorer Team</p>
  </div>
</body>
</html>
  `;

  const mailOptions = {
      to: email, // Use the email from the request body
      subject: 'Unlock the Full Power of AlsoAskExplorer 🚀', // Correct subject
      html: emailHtml
  };

  try {
      // Attempt to send the promotional email
      await sendEmail(mailOptions);
      res.status(200).json({ message: 'Promotion email sent successfully. Please check your inbox.' });
  } catch (error) {
      // Handle email sending errors
      res.status(500).json({ message: 'Failed to send email. Please try again later.' });
  }
};

/**
 * Update the isActive status of a user
 */
exports.updateIsActive = asyncHandler(async (req, res) => {
  const { email, isActive } = req.body;

  // Validate input
  if (!email || typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("Invalid input: email and isActive must be provided.");
  }

  // Find and update the user
  const user = await userModel.findOneAndUpdate(
    { email }, // Filter by email
    { isActive }, // Update the `isActive` field
    { new: true } // Return the updated document
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json({
    success: true,
    message: "User status updated successfully.",
    user,
  });
});

