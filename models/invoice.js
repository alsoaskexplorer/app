const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the invoice schema
const invoiceSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true,
    },
    payment: {
        type: Schema.Types.ObjectId,
        ref: 'payment',
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    issuedDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'canceled'],
        default: 'pending',
    }
}, { timestamps: true });

// Export the model with a clear and descriptive name
module.exports = mongoose.model('Invoice', invoiceSchema); // Capitalized model name for consistency
