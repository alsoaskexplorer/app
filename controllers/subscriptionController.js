// Import necessary modules and models
const asyncHandler = require('express-async-handler');
const crypto = require('crypto'); // For generating unique invoice numbers (optional)
const razorpayInstance = require('../config/razorpayInstance'); // Razorpay instance configured elsewhere
const planModel = require('../models/plan');
const userModel = require('../models/user');
const subscriptionModel = require('../models/subscription');
const paymentModel = require('../models/payment');
const invoiceModel = require('../models/invoice');

// Controller to explore available plans
exports.explorePlans = asyncHandler(async (req, res) => {
    // Fetch all available plans
    let plans = await planModel.find();
    res.render('index', { plans, page: 'explorePlans' }); // Render plans on the page
});

// Controller to create a Razorpay order
exports.createOrder = asyncHandler(async (req, res) => {
    const { amount, currency, receipt, notes } = req.body;

    // Validate incoming request (ensure amount is provided)
    if (!amount) {
        return res.status(400).json({ error: 'Amount is required.' });
    }

    try {
        // Prepare options for Razorpay order (amount should be in paise for INR)
        const options = {
            amount, // Amount to be charged
            currency: currency || 'INR', // Default currency INR
            receipt: receipt || `receipt_${Date.now()}`, // Unique receipt ID
            payment_capture: 1, // Auto capture payment
            notes: notes || {}, // Optional notes
        };

        // Create Razorpay order
        const order = await razorpayInstance.orders.create(options);
        return res.status(200).json(order); // Send order details in response
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
});

// Controller to verify payment and manage subscription
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, currency, razorpay_signature, planId } = req.body;

    // Validate the required payment details
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
        return res.status(400).json({ error: 'Missing payment details for verification.' });
    }

    try {
        // Find user and plan based on the provided planId
        const user = await userModel.findById(req.user.id).populate('subscriptions');
        const plan = await planModel.findById(planId);

        // Check if user and plan exist
        if (!user || !plan) { 
            return res.status(404).json({ error: !user ? 'User not found.' : 'Plan not found.' });
        }

        // Calculate subscription duration based on plan type
        const startDate = new Date();
        let endDate;
        switch (plan.duration) {
            case '1 month':
                endDate = new Date(startDate);
                endDate.setMonth(startDate.getMonth() + 1);
                break;
            case 'lifetime':
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 100); // Long duration for lifetime plan
                break;
            default:
                return res.status(400).json({ error: `Invalid plan duration: ${plan.duration}.` });
        }

        // Check if user already has a subscription for this plan
        let subscription;
        if (user.subscriptions) {
            const renewal = user.subscriptions.findIndex(subscription => subscription.plan.toString() === planId);
            if (renewal !== -1) { // Renew existing subscription
                subscription = user.subscriptions[renewal];
                subscription.startDate = new Date();
                subscription.endDate = endDate;
                subscription.status = 'active';
                subscription.active = true;
                await subscription.save();
            } else { // Create a new subscription if not found
                subscription = await subscriptionModel.create({ 
                    user: user._id, 
                    plan: plan._id, 
                    startDate, 
                    endDate, 
                    status: "active", 
                    active: true 
                });
                user.subscriptions.push(subscription._id);
                await user.save();
            }
        }

        // Record the payment transaction
        const payment = await paymentModel.create({
            user: user._id,
            subscription: subscription._id,
            currency,
            amount: plan.price,
            paymentDate: new Date(),
            paymentMethod: 'razorpay',
            status: 'successful',
            transactionId: razorpay_payment_id,
        });

        // Associate payment with subscription
        subscription.payments.push(payment._id);
        await subscription.save();

        // Create or update invoice record
        const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const issuedDate = new Date();
        const invoice = await invoiceModel.findOneAndUpdate(
            { user: user._id },
            {
                plan_id: planId,
                payment: payment._id,
                invoiceNumber,
                issuedDate,
                dueDate: endDate,
                totalAmount: plan.price,
            },
            { new: true, upsert: true } // Insert if not found
        );

        return res.status(200).json({ message: 'Payment successful.', paymentId: razorpay_payment_id });
    
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Controller to create new plans (admin only)
exports.createPlans = async (req, res) => {
    try {
        // Insert new plans into the database (example plans)
        let plans = await planModel.insertMany([
            { 
                title: 'Monthly',
                description: 'Unlimited Searches For 1 Month',
                price: 9,
                duration: '1 month',
            },
            { 
                title: 'Lifetime',
                description: 'Unlimited Searches For Lifetime',
                price: 79,
                duration: 'lifetime',
            },
        ]);

        return res.status(200).json({ message: 'Plans created successfully', plans });
    } catch (error) {
        console.error('Error creating plans:', error);
        return res.status(500).json({ error: 'Failed to create plans', details: error.message });
    }
};

// Controller to view user's billing cycle/payment history
exports.billingCycle = asyncHandler(async (req, res) => {
    // Fetch all payments made by the user and populate subscription and plan data
    const payments = await paymentModel.find({ user: req.user.id }).populate({
        path: 'subscription',
        populate: {
            path: 'plan',
            select: 'title', // Retrieve only the 'title' of the plan
        },
    });

    // Render billing cycle data on the page
    res.render('index', { payments, page: 'billingCycle' });
});

// Controller to view user's active subscription plan
exports.activePlan = asyncHandler(async (req, res) => {
    // Find the active subscription for the user
    const subscription = await subscriptionModel.findOne({ user: req.user.id, active: true }).populate('plan');

    // Render the active plan page with subscription data
    res.render('index', { subscription, page: 'myPackage' });
});
