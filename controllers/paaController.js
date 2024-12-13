// Import necessary modules
const NodeCache = require('node-cache');
const fetchQuestionsAxios = require('../utils/fetchQuestions/axiosCheerio');
const fetchQuestionsPuppeteer = require('../utils/fetchQuestions/puppeteer');
const fetchQuestionsPlaywright = require('../utils/fetchQuestions/playwright');
const fetchQuestionsSelenium = require('../utils/fetchQuestions/selenium');
const user = require('../models/user');
const paa = require('../models/paa');

// Initialize cache (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

// Function to fetch and return questions
const getQuestions = async (req, res) => {
  const { keyword, hl, gl } = req.query;

  // Validate required query parameters
  if (!keyword || !hl || !gl) {
    const missingParams = [
      !keyword && 'keyword',
      !hl && 'Human Language (hl)',
      !gl && 'Geo Location (gl)',
    ].filter(Boolean).join(', ');

    return res.status(400).send({ error: `Missing required parameter(s): ${missingParams}` });
  }

  // Generate cache key based on query parameters
  const cacheKey = `${keyword}-${hl}-${gl}`;
  const cachedQuestions = cache.get(cacheKey);

  // If questions are cached, return the cached data
  if (cachedQuestions) {
    if (req.query.layer === 'd3') {
      return res.render('questions', { node: keyword, questions: cachedQuestions });
    }
    return res.status(200).render('index', { node: keyword, hl, gl, questions: cachedQuestions, page: 'exploreQuery' });
  }

  // Define the methods to fetch questions (ordered by priority)
  const fetchMethods = [
    fetchQuestionsAxios,
    fetchQuestionsPuppeteer,
    fetchQuestionsPlaywright,
    fetchQuestionsSelenium,
  ];

  let mainQuestions = [];

  try {
    // Try fetching main questions using each method until successful
    for (const fetchMethod of fetchMethods) {
      try {
        mainQuestions = await fetchMethod(keyword, hl, gl);
        if (mainQuestions.length > 0) break; // Exit loop when questions are found
      } catch (methodError) {
        console.warn(`Error in method ${fetchMethod.name}:`, methodError.message);
        continue; // Continue to next method if error occurs
      }
    }

    // Return error if no questions were found
    if (mainQuestions.length === 0) {
      return res.status(404).send({ error: 'No questions found' });
    }

    // Fetch nested questions for each main question
    const allQuestions = [];
    for (const question of mainQuestions) {
      let nestedQuestions = [];
      for (const fetchMethod of fetchMethods) {
        try {
          const nested = await fetchMethod(question, hl, gl);
          nestedQuestions = [...nestedQuestions, ...nested];
          if (nested.length > 0) break;
        } catch (nestedError) {
          console.warn(`Error fetching nested questions with ${fetchMethod.name}:`, nestedError.message);
          continue;
        }
      }
      allQuestions.push({ question, nested: nestedQuestions });
    }

    // If user is logged in, update their search query in the database
    if (req.user?.id) {
      let activeUser = await user.findById(req.user.id);

      const item = await paa.findOneAndUpdate(
        {
          'query.q': keyword,  // Search by keyword
          'query.hl': hl,      // Search by hl (language or another param)
          'query.gl': gl,      // Search by gl (geolocation or another param)
          user: activeUser._id // Add user filter
        },
        {
          $set: {
            'query.q': keyword,
            'query.hl': hl,
            'query.gl': gl
          }
        },
        {
          new: true,   // Return the updated document
          upsert: true // Insert if no document matches
        }
      );

      if (!activeUser.paa.includes(item._id)) {  // Check if the item is not already in user's paa
        activeUser.paa.push(item._id);  // Push only if not already present
      }

      // Save the updated user document
      await activeUser.save();
    }

    // Cache the result and render the response
    cache.set(cacheKey, allQuestions);

    if (req.query.layer === 'd3') {
      return res.render('questions', { node: keyword, questions: allQuestions });
    }
    return res.status(200).render('index', { node: keyword, hl, gl, questions: allQuestions, page: 'exploreQuery' });

  } catch (error) {
    console.error('Error retrieving questions:', error);
    return res.status(500).send({ error: 'Failed to retrieve questions' });
  }
};

// Function to handle user search history and render results
const searchQuestion = async (req, res) => {
  // Fetch user's search history (paa collection) and populate related data
  const activeUser = await user.findOne({ _id: req.user.id }).populate('paa');

  // Check if user exists and has search queries
  if (!activeUser || !activeUser.paa) {
    return res.render('index', { searchQueries: [], page: "searchQuery", error: "No search queries found." });
  }

  // Reverse search queries to show the most recent first
  let searchQueries = activeUser.paa.reverse();

  // Render the search query page with user search history
  res.render('index', { searchQueries, page: "searchQuery" });
};

// Export functions
module.exports = { getQuestions, searchQuestion };
