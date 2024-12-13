const asyncHandler = require("express-async-handler");
const userModel = require("../models/user");

exports.AuthorizeSearch = asyncHandler(async (req, res, next) => {
    // Fetch the user by their ID and populate related fields (paa and subscriptions)
    const user = await userModel.findById(req.user.id).populate([
        { path: 'paa' }, // 'paa' tracks the search history or search count
        {
            path: 'subscriptions', // Subscriptions field
        }
    ]);

    // If no user is found, handle it
    if (!user) {
        req.flash('error', 'User not found.');
        return res.redirect('/login');
    }

    // Check if the user has any subscription
    const hasSubscription = user.subscriptions && user.subscriptions.length > 0;

    // Check if the user has an active subscription
    const hasActiveSubscription = user.subscriptions && user.subscriptions.some(sub => sub.active === true);

    // Check if the user has an inactive subscription
    const hasInactiveSubscription = user.subscriptions && user.subscriptions.some(sub => sub.active === false);

    // Check the number of searches, default to 0 if none
    const freeSearchLimit = 5;
    const searchesCount = user.paa ? user.paa.length : 0;

    // If the user has an active subscription, allow unlimited searches
    if (hasActiveSubscription) {
        return next();
    }

    // If the user has an inactive subscription, show a specific message
    if (hasInactiveSubscription) {
        req.flash('error', 'Your subscription is inactive. Please renew or upgrade to continue searching.');
        return res.redirect('/explore-plans');
    }

    // If the user does not have a subscription but has used fewer than the free search limit, allow the search
    if (!hasSubscription && searchesCount < freeSearchLimit) {
        return next(); // Allow the search as the user is within the free limit
    }

    // If the user has no active subscription and has reached the free search limit, redirect to the subscription page
    if (!hasSubscription && searchesCount >= freeSearchLimit) {
        req.flash('error', 'You have reached the free search limit of 5. Please purchase a subscription to continue searching.');
        return res.redirect('/explore-plans');
    }

    // Proceed to the next middleware if all checks pass
    next();
});
