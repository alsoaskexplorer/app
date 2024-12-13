// routes/paaRoutes.js
const express = require('express');

const { getQuestions, searchQuestion} = require('../controllers/paaController');
const { isLoggedIn } = require("../middleware/authMiddleware");
const { AuthorizeSearch } = require("../middleware/AuthorizeSearch");
const { guestSearchLimiter } = require("../middleware/guestSearchLimiter");

const router = express.Router();

router.get('/searchQuestion',isLoggedIn, searchQuestion);
router.get('/paa',isLoggedIn, AuthorizeSearch, getQuestions);

router.get('/guestSearch', guestSearchLimiter, getQuestions);

module.exports = router;
