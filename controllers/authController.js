const asyncHandler = require('express-async-handler');
const userModel = require('../models/user');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Render the registration form
exports.create = async (req, res) => {
    res.render('auth/register');
};

// Handle user registration and store new user data
exports.store = asyncHandler(async (req, res) => {
    const { name, email, country, password } = req.body;

    // Check if the user already exists in the database
    let user = await userModel.findOne({ email });
    if (user) {
        // If user exists, return a conflict response
        return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);  // Salt rounds for hashing
    const hash = await bcrypt.hash(password, salt);

    // Create a new user in the database
    user = await userModel.create({
        name,
        email,
        address: { country },
        password: hash,
    });

    // Generate a token for the newly registered user
    const token = generateToken(user._id);
    res.cookie("token", token);  // Set the token in the cookie for authentication

    // Respond with a success message
    res.status(200).json({ message: "Registration successful" });
});

// Render the login form
exports.login = (req, res) => {
    res.render('auth/login');
};

// Handle login authentication and check credentials
exports.checkLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const user = await userModel.findOne({ email });

    // If user doesn't exist, return an error message
    if (!user) {
        return res.status(500).json({ message: 'User does not exist!' });
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {

        if(!user.isActive) 
        {
            return res.status(500).json({ message: 'Your account blocked, pls contact to support!' });
        }
        // If password matches, generate and set the authentication token
        const token = generateToken(user._id);
        res.cookie("token", token);  // Set the token in the cookie
        return res.status(200).json({ message: 'Login successful. Welcome back!' });
    } else {
        // If password doesn't match, return an error
        return res.status(500).json({ message: 'Invalid credentials!' });
    }
});

// Log the user out by clearing the token cookie
exports.logout = (req, res) => {
    res.cookie("token", '');  // Clear the token cookie
    res.redirect('/login');  // Redirect to the login page
};

// Render the password reset request form
exports.requestReset = asyncHandler(async (req, res) => {
    res.render('auth/requestReset');
});

// Handle password reset request and send reset email
exports.requestResetPost = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find the user by email
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Generate a secure reset token and set its expiration time (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000;  // Token valid for 1 hour
    await user.save();

    // Prepare the reset password email content
    const mailOptions = {
        to: user.email,
        subject: 'Password Reset Request',
        html: `Dear ${user.name},<br><br>` +
            `We received a request to reset the password for your account. If you made this request, please follow the instructions below to complete the process.<br><br>` +
            `Click the link below to reset your password:<br><br>` +
            `<a href="http://${req.headers.host}/reset-password/${token}">Reset Your Password</a><br><br>` +
            `If you did not request a password reset, please disregard this email. Your account will remain secure.<br><br>` +
            `Best regards,<br>The alsoaAskExplorer Team`,
    };

    try {
        // Attempt to send the reset email
        await sendEmail(mailOptions);
        res.status(200).json({ message: 'Further instructions have been sent to your email. Please check your inbox.' });
    } catch (error) {
        // Handle email sending errors
        res.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }
});

// Render the password reset page with the token
exports.reset_passwordToken = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Check if the reset token is valid and hasn't expired
    const user = await userModel.findOne({
        resetToken: token,
        resetTokenExpire: { $gt: Date.now() },  // Token must not be expired
    });

    if (!user) {
        return res.status(400).send('Invalid or expired token.');
    }

    // Render the reset password page and pass the token
    res.render('auth/resetPassword', { resetToken: token });
});

// Handle the password reset process and update the user's password
exports.reset_passwordTokenPost = asyncHandler(async (req, res) => {
    const { resetToken, password } = req.body;

    // Validate the new password (minimum length check)
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Find the user by reset token and check if it's still valid
    const user = await userModel.findOne({
        resetToken: resetToken,
        resetTokenExpire: { $gt: Date.now() },  // Token must not be expired
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    try {
        // Hash the new password before saving it
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update the user's password and clear the reset token
        user.password = hashedPassword;
        user.resetToken = undefined;  // Clear the reset token
        user.resetTokenExpire = undefined;  // Clear the expiration time
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        // Handle errors that might occur during password update
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
});
