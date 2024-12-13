// Import necessary libraries
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    // Log error and exit process if connection fails
    console.error(error.message);
    process.exit(1);
  }
};

// Export the connection function
module.exports = connectDB;
