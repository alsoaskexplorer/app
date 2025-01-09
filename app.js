const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const cron = require("node-cron");
const CronSubscription = require('./models/subscription'); // Adjust path based on your project structure

const app = express();
const port = process.env.PORT || 3000;

// Load environment variables
dotenv.config();

// Set up session middleware
app.use(session({
    secret: 'VRd5uBbXjF85Tyt4NDSwOWCZueIMY4P2QLBwqzQFFwk=',
    resave: false,
    saveUninitialized: true,
}));

// Flash middleware
app.use(flash());

// Middleware to make flash messages available in views
app.use((req, res, next) => {
    res.locals.messages = req.flash();  // Makes messages available in templates
    next();
});

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the "public" directory
app.use(express.static("public"));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // Set the views directory

// Home route
app.get('/', (req, res) => {
    res.render('index', (err) => {
        if (err) {
            console.error('Error rendering view:', err);
            return res.status(500).send('Error rendering view');
        }
    });
});

// Import and use routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/userRoutes"));
app.use("/", require("./routes/subscriptionRoutes"));
app.use("/", require("./routes/openaiRoutes"));
app.use("/", require('./routes/paaRoutes'));
app.use("/", require('./routes/wpRoutes'));

// Admin routes
app.use("/", require("./routes/adminRoutes"));

//Cron Schedule For Subscription Controlling
cron.schedule("0 0 * * *", async function () {  // Runs once every day at midnight
    console.log("Running a task every day at midnight");

    try {
        // Get today's date at midnight (no time component)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to 00:00 to compare only the date part
        console.log("Today's date (normalized):", today);

        // Find all active subscriptions where the endDate is less than or equal to today
        const subscriptions = await CronSubscription.find({
            endDate: { $lte: today },
            active: true,
        });

        console.log("Subscriptions found:", subscriptions.length);

        if (subscriptions.length > 0) {
            // Update each subscription's active status to false and mark as expired
            const updatedSubscriptions = await Promise.all(
                subscriptions.map(async (subscription) => {
                    subscription.active = false;
                    subscription.status = "expired"; // Mark as expired
                    return await subscription.save(); // Return the saved subscription for logging
                })
            );

            console.log(`Updated ${updatedSubscriptions.length} subscriptions.`);
            return updatedSubscriptions.length; // Return the number of updated subscriptions
        }

        console.log("No subscriptions to update.");
        return 0; // No subscriptions to update
    } catch (error) {
        console.error("Error during cron job:", error);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
