const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

mongoose.connect("mongodb+srv://alsoaskexplorer:BFQ7$XZ97irzqxA@alsoaskexplorer.oz2hb.mongodb.net/?retryWrites=true&w=majority&appName=alsoaskexplorer");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Removes whitespace from both ends
    },
    password: {
      type: String,
      required: true,
    },
    
    openAiKey: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      // required: true,
    },
    dob: {
      type: Date,
      // required: true,
    },
    phone: {
      type: String,
      // required: false // Make it required if needed
    },
    address: {
      country: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        // required: true,
      },
      city: {
        type: String,
        // required: true,
      },
      postcode: {
        type: String,
        // required: true,
      },
      addressLine: {
        type: String,
        // required: true,
      },
    },
    domain: {
      type: String,
      // required: true,
    },
    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "subscription" },
    ],
    paa: [
      { type: mongoose.Schema.Types.ObjectId, ref: "paa" },
    ],
    limit: { type: Number, default: 5 },
    resetToken: String,
    resetTokenExpire: Date,
    isActive: { type: Boolean, default: true},
  },
  { timestamps: true }
);


// Hash password before saving the user
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });


module.exports = mongoose.model("user", userSchema);
