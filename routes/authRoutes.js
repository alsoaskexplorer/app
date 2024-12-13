const express = require("express");
const { create, store, login, checkLogin, logout, requestReset, requestResetPost, reset_passwordToken, reset_passwordTokenPost } = require("../controllers/authController");
const { isLoggedIn } = require("../middleware/authMiddleware");

const { registerValidation, loginValidation, validateUser } = require('../validators/authValidator');

const router = express.Router();

router.get("/register", create);
router.post('/register', registerValidation, validateUser, store);


router.get("/login", login);
router.post("/login", loginValidation, checkLogin);

router.get("/logout", logout);

router.get("/request-reset", requestReset);
router.post("/request-reset", requestResetPost);
router.get("/reset-password/:token", reset_passwordToken);
router.post("/reset-password", reset_passwordTokenPost);

module.exports = router; 