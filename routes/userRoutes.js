const express = require("express");
const { dashboard, profile, updateProfile } = require("../controllers/userController");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { profile_update_post, validateProfileUpdate} = require('../validators/profileValidator.js');

const router = express.Router();

router.get("/my-profile", isLoggedIn, profile);
router.post('/update-profile', isLoggedIn, profile_update_post, validateProfileUpdate, updateProfile);
router.get("/dashboard", isLoggedIn, dashboard);

module.exports = router;

