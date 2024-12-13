const jwt = require('jsonwebtoken');

// Function to generate a JWT token
const generateToken = (userId) => {
    // Sign the token with the user's ID and a secret key
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expiration (30 days in this case)
    });
};

module.exports = generateToken;