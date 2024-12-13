const asyncHandler = require('express-async-handler');
const userModel = require("../models/user");

// Profile route handler
exports.profile = asyncHandler(async (req, res) => {
    let user = await userModel.findOne({ _id: req.user.id });
    res.render('index', { user, page: 'myprofile' });
});

// Update Profile route handler
exports.updateProfile = asyncHandler(async (req, res) => {
    // Destructure the incoming data
    const { name, email, gender, dob, phone, openAiKey, country, state, city, postcode, addressLine, domain } = req.body;

    // Create the address object
    const address = { country, state, city, postcode, addressLine };

    const updatedUser = await userModel.findOneAndUpdate(
        { _id: req.user.id },
        { name, email, gender, dob, phone, openAiKey, address, domain },
        { new: true, runValidators: true } // Return the updated document and apply validators
    );

    // Handle case if user not found
    if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Return success response with updated user info
    return res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });

});

// Dashboard route handler
exports.dashboard = asyncHandler(async (req, res) => {
    // Find the user by ID and populate active subscriptions
    const user = await userModel.findById(req.user.id)
        .populate([
            {
                path: 'subscriptions',
                match: { status: 'active' }, // Filter only active subscriptions
                populate: {
                    path: 'plan', // Populate the 'plan' field inside each subscription
                    select: 'title price' // Select the fields you want from the 'plan' (e.g., 'title' and 'price')
                }
            },
            { path: 'paa' } // Populate other field (paa) without filtering
        ]);

    res.render('index', { page: 'dashboard', user });
});
