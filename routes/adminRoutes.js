const express = require("express");
const { dashboard, manage, creditLimit, sendPromotionEmail, manageUsers, updateIsActive } = require("../controllers/adminController");
// Uncomment this line if you plan to use authentication middleware
// const { isLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

// Route to manage users (view users)
router.get("/admin/dashboard", dashboard);
router.get("/admin/manage-users", manageUsers);

// Route to credit the limit for a user
router.post("/credit-limit", creditLimit);
router.post("/send-promotion-email", sendPromotionEmail);
router.post("/update-is-active", updateIsActive);

// Dynamic Routes for Other Pages
// router.get('admin/:page', (req, res) => {
//     const validPages = ['about', 'contact', 'help']; // Add valid page names here
//     const page = req.params.page;

//     if (validPages.includes(page)) {
//         res.render('admin/index', { page });
//     } else {
//         res.status(404).render('admin/index', { page: '404' });
//     }
// });

module.exports = router;