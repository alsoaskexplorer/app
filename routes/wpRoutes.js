const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const {
  getWPSites,
  addWPSite,
  deleteWPSite,
  createPost,
  createWPPost,
} = require("../controllers/wpController"); // Import all required controllers

const router = express.Router();

// Route to display WordPress sites
router.get("/wp-sites", isLoggedIn, getWPSites);

// Route to add a new WordPress site
router.post("/wp-sites", isLoggedIn, addWPSite);

// Route to delete a WordPress site (delete site based on siteId)
router.delete("/wp-sites/:siteId", isLoggedIn, deleteWPSite);

// Route to create a WordPress post with URL in the route
router.post("/wp-posts/:siteUrl", isLoggedIn, createWPPost);  // Route with dynamic URL

module.exports = router;
