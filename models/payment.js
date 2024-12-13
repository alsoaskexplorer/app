const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Payment schema
const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'user',
        required: true,
    },
    subscription: {
        type: Schema.Types.ObjectId, 
        ref: 'subscription',
        required: true,
    },
    currency: {
        type: String,
        default: 'USD', // Default currency
        enum: ['USD', 'EUR', 'INR', 'GBP'], // Expand as necessary
    },
    amount: {
        type: Number,
        required: true,
        min: 0, // Ensures amount can't be negative
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    paymentMethod: { 
        type: String, 
        enum: ['credit_card', 'paypal', 'razorpay'],
        required: true,
    },
    status: {
        type: String,
        enum: ['successful', 'failed', 'pending'],
        default: 'successful',
    },
    transactionId: { 
        type: String, 
        required: true,
        // Uncomment and customize if transaction ID validation is required
        // validate: {
        //     validator: function(v) {
        //         return /^[a-zA-Z0-9_-]{10,}$/.test(v); // Example regex for ID validation
        //     },
        //     message: props => `${props.value} is not a valid transaction ID!`
        // }
    }, // Store Stripe, PayPal, or RazorPay transaction ID
}, { timestamps: true });

// Export the model with a clear and descriptive name
module.exports = mongoose.model('payment', paymentSchema);
