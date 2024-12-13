const express = require("express");

const { AiGenResults } = require("../controllers/openaiController");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { AuthorizeSearch } = require("../middleware/AuthorizeSearch");

const router = express.Router();

router.get("/get-aiGen-answer/:query", isLoggedIn, AiGenResults);

module.exports = router;
