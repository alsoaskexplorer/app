const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the subscription plan schema
const subscriptionPlanSchema = new Schema({
    title: { // Clear and descriptive name for the plan
        type: String,
        required: true,
        trim: true, // Removes whitespace from the beginning and end
    },
    description: { // More specific than 'details', better reflects the content
        type: String,
        required: true,
        trim: true, // Removes whitespace from the beginning and end
    },
    currency: { // Optional field for future use
        type: String,
        default: 'USD', // Default currency
        enum: ['USD', 'EUR', 'INR', 'GBP'], // Expand as necessary
    },
    price: {
        type: Number,
        required: true,
        min: 0, // Ensures price cannot be negative
    },
    duration: { // This field clearly defines the length of the subscription
        type: String,
        // enum: ['free', '1 month', '1 year'], // Updated for clarity and consistency
        enum: ['free', '1 month', 'lifetime'],
        required: true,
    },
}, { timestamps: true });

// Export the model with a clear and descriptive name
module.exports = mongoose.model('plan', subscriptionPlanSchema);
