const NodeCache = require('node-cache');
const fetchQuestionsAxios = require('../utils/fetchQuestions/axiosCheerio');
const fetchQuestionsPuppeteer = require('../utils/fetchQuestions/puppeteer');
const fetchQuestionsPlaywright = require('../utils/fetchQuestions/playwright');
const fetchQuestionsSelenium = require('../utils/fetchQuestions/selenium');
const user = require('../models/user');
const paa = require('../models/paa');

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const getQuestions = async (req, res) => {
  const { keyword, hl, gl } = req.query;

  // Validate query parameters
  if (!keyword || !hl || !gl) {
    const missingParams = [
      !keyword && 'keyword',
      !hl && 'Human Language (hl)',
      !gl && 'Geo Location (gl)',
    ].filter(Boolean).join(', ');

    return res.status(400).send({ error: `Missing required parameter(s): ${missingParams}` });
  }

  // Check if the questions are already cached
  const cachedQuestions = cache.get(keyword);
  if (cachedQuestions) {

    if(req.query.layer === 'd3')
    {
      return res.render('questions', {node: keyword, questions: cachedQuestions });
    }
    // return res.render('questions', { questions: cachedQuestions });
    return res.status(200).render('index', { node: keyword, hl, gl, questions: cachedQuestions, page: 'exploreQuery' });
  }

  // Define the fetch methods in the desired order of priority
  const fetchMethods = [
    fetchQuestionsAxios,
    fetchQuestionsPuppeteer,
    fetchQuestionsPlaywright,
    fetchQuestionsSelenium,
  ];

  let mainQuestions = [];

  try {
    // Attempt each fetch method until we get a result
    for (const fetchMethod of fetchMethods) {
      try {
        mainQuestions = await fetchMethod(keyword, hl, gl);
        if (mainQuestions.length > 0) break; // Exit the loop if main questions are found
      } catch (methodError) {
        console.warn(`Error in method ${fetchMethod.name}:`, methodError.message);
        continue; // Continue with the next fetch method if this one fails
      }
    }

    // If no main questions were found, handle as a 404
    if (mainQuestions.length === 0) {
      return res.status(404).send({ error: 'No questions found' });
    }

    // Fetch nested questions for each main question
    const allQuestions = [];
    for (const question of mainQuestions) {
      let nestedQuestions = [];

      // Fetch nested questions for each method
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

    // const item = await paa.findOneAndUpdate(
    //   { q: keyword, hl: hl, gl: gl },  // Filter by multiple fields
    //   { $set: { q: keyword, hl: hl, gl: gl } },  // Update fields if found
    //   { new: true, upsert: true }  // Return the updated document or insert if not found
    // );

    // if (req.user?.id) {
    //   let activeUser = await user.findById(req.user.id);

    //   const item = await paa.findOneAndUpdate(
    //     {
    //       'query.q': keyword,  // Search by keyword
    //       'query.hl': hl,      // Search by hl (perhaps language or another param)
    //       'query.gl': gl,      // Search by gl (geolocation or another param)
    //       user: activeUser._id // Add user filter (assuming `user` is a field in the `paa` document)
    //     },
    //     {
    //       $set: {
    //         'query.q': keyword,
    //         'query.hl': hl,
    //         'query.gl': gl
    //       }
    //     },
    //     {
    //       new: true,   // Return the updated document
    //       upsert: true // Insert if no document matches the query
    //     }
    //   );

    //   if (!activeUser.paa.includes(item._id)) {  // Check if the item is not already in the user's paa array
    //     activeUser.paa.push(item._id);  // Push only if the ID isn't already present
    //   }

    //   // Save the updated user document
    //   await activeUser.save();
    // }

    if (req.user?.id) {
      try {
        // Find the active user
        let activeUser = await user.findById(req.user.id);
    
        if (!activeUser) {
          return res.status(404).send('User not found');
        }
    
        // Find the item that matches the conditions
        const items = await paa.find({
          "query.q": keyword,
          "query.hl": hl,
          "query.gl": gl,
          "user": activeUser._id,
        });
    
        // If no items are found, create a new one
        if (items.length === 0) {
          console.log("No items found, creating a new item...");
    
          const newItem = new paa({
            "query.q": keyword,
            "query.hl": hl,
            "query.gl": gl,
            user: activeUser._id,  // Associate the new item with the active user
          });
    
          // Save the new item
          await newItem.save();
    
          console.log("New item created:", newItem);
    
          // Push the new item's ID to the user's paa array if it's not already there
          if (!activeUser.paa.includes(newItem._id)) {
            activeUser.paa.push(newItem._id);
          }
    
          // Save the updated user document
          await activeUser.save();
    
          // Send a response with the new item
          res.status(201).json(newItem);  // Send the new item with "Created" status
        } else {
          // If items are found, send them as a response
          console.log("Found items:", items);
    
          // Check if the item is already in the user's paa array (if you want to process this logic here)
          if (!activeUser.paa.includes(items[0]._id)) { // Assuming you're checking the first matched item
            activeUser.paa.push(items[0]._id);
            await activeUser.save();
          }
    
          // Send the found items in the response
          res.status(200).json(items);  // Send found items with "OK" status
        }
    
      } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
      }
    }
    
    // Cache the result and render
    cache.set(keyword, allQuestions);
    
    if (req.query.layer === 'd3') { return res.render('questions', { node: keyword, questions: allQuestions });}
    return res.status(200).render('index', { node: keyword, hl, gl, questions: allQuestions, page: 'exploreQuery' });

  } catch (error) {
    console.error('Error retrieving questions:', error);
    return res.status(500).send({ error: 'Failed to retrieve questions' });
  }
};

const searchQuestion = async (req, res) => {
  // Rename the local variable to avoid naming conflict with the model
  const activeUser = await user.findOne({ _id: req.user.id }).populate('paa');

  // Check if the user exists and has the paa property
  if (!activeUser || !activeUser.paa) { return res.render('index', { searchQueries: [], page: "searchQuery", error: "No search queries found." });}
  let searchQueries = activeUser.paa.reverse();

  res.render('index', { searchQueries, page: "searchQuery" });
};

module.exports = { getQuestions, searchQuestion };


const transporter = require('../utils/transporter');

// Define your mail options
const mailOptions = {
  to: user.email,
  subject: 'Welcome to Our Service!',
  text: 'Thank you for signing up!',
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
