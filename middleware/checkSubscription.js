const asyncHandler = require("express-async-handler");
const userModel = require("../models/user");

exports.checkSubscription = asyncHandler(async (req, res, next) => {
    // Fetch the user by their ID and populate related fields
    const user = await userModel.findById(req.user.id).populate({
        path: 'subscriptions',
        match: { active: true }, // Fetch only active subscriptions
    });

    if(user.subscriptions.length > 0)
    {
        return res.status(403).json({
            success: false,
            message: 'You already have an active subscription.',
        });
    }
    
    // No active subscription, proceed to the next middleware
    next();
});
