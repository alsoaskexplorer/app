const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Helper function to strip the time from the date (only keeping the date part)
const stripTime = (date) => {
    if (date) {
        return new Date(date.setHours(0, 0, 0, 0));  // Sets time to 00:00:00
    }
    return date;
};

// Define the Subscription schema
const subscriptionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    plan: {
        type: Schema.Types.ObjectId,
        ref: 'plan',
        required: true,
    },
    startDate: { 
        type: Date,
        required: true,
        default: Date.now,
        set: stripTime,  // Ensure no time is stored
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                // Ensure end date is after start date
                return value > this.startDate;
            },
            message: 'End date must be after start date.',
        },
        set: stripTime,  // Ensure no time is stored
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'canceled'],
        default: 'active',
    },
    active: {
        type: Boolean,
        default: true,
    },
    payments: [{
        type: Schema.Types.ObjectId,
        ref: 'payment',
        default: [],
    }],
}, { timestamps: true });

// Export the model with a clear and descriptive name
module.exports = mongoose.model('subscription', subscriptionSchema);
