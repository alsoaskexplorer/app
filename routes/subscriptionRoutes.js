const express = require("express");
require('dotenv').config(); // At the top of your server file

const {explorePlans, createOrder, verifyPayment, createPlans, billingCycle, activePlan} = require("../controllers/subscriptionController");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkSubscription } = require("../middleware/checkSubscription");

const router = express.Router();

// Route to create a Razorpay order
// router.post('/createOrder', createOrder);

// Route to verify the payment after successful payment
// router.post('/verify', verifyPayment);

// router.get("/active-plan", isLoggedIn, activePlan);

router.get("/explore-plans", isLoggedIn, explorePlans);
router.post("/create-order", isLoggedIn, checkSubscription, createOrder);
router.post("/verify-payment", isLoggedIn, verifyPayment);
router.get("/payment-history", isLoggedIn, billingCycle);
router.get("/active-plan", isLoggedIn, activePlan);

router.get("/create-plans", createPlans);

module.exports = router;