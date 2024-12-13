const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const userModel = require("../models/user");

// Middleware to check if the user is logged in
exports.isLoggedIn = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;

    // If there's no token, redirect to login
    if (!token || token === '') {
        return res.redirect('/login');
    }

    try {
        // Verify the token
        const data = jwt.verify(token, process.env.JWT_SECRET); // Ensure the secret is stored in env variable
        req.user = data;

        // Find the authenticated user in the database
        const authUser = await userModel.findById(req.user.id);

        // Set global 'auth' variable for authenticated user
        res.locals.auth = authUser || null;

        next();
    } catch (error) {
        // Handle invalid token or any error in verification
        return res.status(401).redirect('/login');
    }
});
