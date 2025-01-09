const asyncHandler = require('express-async-handler');
const userModel = require("../models/user");
const WordpressConfig = require("../models/wordpressConfig");
const axios = require("axios");

// Controller to get all WordPress sites for the logged-in user
exports.getWPSites = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is in req.user
    const userConfig = await WordpressConfig.findOne({ user: userId });

    res.render("index", { page: "wpsites", configs: userConfig ? userConfig.wpconfig : [] });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Controller to add a new WordPress site
// exports.addWPSite = async (req, res) => {
//   try {    
//     const userId = req.user.id; // Assuming user ID is in req.user
//     const { url, username, password } = req.body;

//     if (!url || !username || !password) {
//       return res.status(400).send("All fields are required");
//     }

//     let userConfig = await WordpressConfig.findOne({ user: userId });
//     // const user = await userModel.findById(req.user.id)

//     if (!userConfig) {
//       // Create a new document if none exists
//       userConfig = new WordpressConfig({
//         user: userId,
//         wpconfig: [{ url, username, password }],
//       });
//     } else {
//       // Append the new configuration to the array
//       userConfig.wpconfig.push({ url, username, password });
//     }

//     await userConfig.save();
//     res.redirect("/wp-sites"); // Redirect to the list of WordPress sites
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// };
exports.addWPSite = async (req, res) => {
  try {    
    const userId = req.user.id; // Assuming user ID is in req.user
    const { url, username, password } = req.body;

    if (!url || !username || !password) {
      return res.status(400).send("All fields are required");
    }

    let userConfig = await WordpressConfig.findOne({ user: userId });

    if (!userConfig) {
      // Create a new document if none exists
      userConfig = new WordpressConfig({
        user: userId,
        wpconfig: [{ url, username, password }],
      });
    } else {
      // Check if the URL already exists in the wpconfig array
      const isDuplicate = userConfig.wpconfig.some((site) => site.url === url);

      if (isDuplicate) {
        return res.status(400).send("This URL is already added.");
      }

      // Append the new configuration to the array
      userConfig.wpconfig.push({ url, username, password });
    }

    await userConfig.save();
    res.redirect("/wp-sites"); // Redirect to the list of WordPress sites
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
  
// Controller to delete a WordPress site based on its index in the wpconfig array
exports.deleteWPSite = asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user ID is stored in req.user
      const siteIndex = req.params.siteId; // Get the site index from the URL parameters
  
      // Find the user's WordPress configuration
      const userConfig = await WordpressConfig.findOne({ user: userId });
  
      if (!userConfig) {
        return res.status(404).send("No WordPress sites found for this user.");
      }
  
      // Ensure the siteIndex is a valid number and within bounds
      if (isNaN(siteIndex) || siteIndex < 0 || siteIndex >= userConfig.wpconfig.length) {
        return res.status(400).send("Invalid site index");
      }
  
      // Remove the site from the wpconfig array using the index
      userConfig.wpconfig.splice(siteIndex, 1);
  
      // Save the updated configuration back to the database
      await userConfig.save();
  
      // Return a success message
      res.status(200).send("Site deleted successfully.");
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });


exports.createWPPost = async (req, res) => {
  const { siteUrl } = req.params; // Extract the site URL from the request URL
  const { title, content } = req.body; // Extract the title and content from the POST body

  try {
    // Fetch WordPress configuration from the database
    const wpConfig = await WordpressConfig.findOne({ user: req.user.id });

    if (!wpConfig) {
      return res.status(404).json({ message: 'WordPress configuration not found for this user.' });
    }

    // Find the site matching the URL in the configuration
    const siteIndex = wpConfig.wpconfig.findIndex(site => site.url === siteUrl);

    if (siteIndex === -1) {
      return res.status(404).json({ message: 'The provided site URL does not exist in the configuration.' });
    }

    // Get the selected site configuration
    const selectedSite = wpConfig.wpconfig[siteIndex];

    // Ensure the URL is valid and append /wp-json/wp/v2/posts if necessary
    const apiUrl = new URL('/wp-json/wp/v2/posts', selectedSite.url).href;

    // WordPress API credentials
    const WP_USERNAME = selectedSite.username;
    const WP_PASSWORD = selectedSite.password;

    // Encode credentials for Basic Authentication
    const WP_AUTH = `Basic ${Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64')}`;

    // Post data (title and content can be dynamically generated)
    const postData = {
      title,
      content,
      status: 'publish', // Adjust as needed
    };

    // Make the API request to create the WordPress post
    const response = await axios.post(apiUrl, postData, {
      headers: {
        'Authorization': WP_AUTH,
        'Content-Type': 'application/json',
      },
    });

    // Respond with the API response
    return res.status(200).json({
      message: 'Post created successfully!',
      post: response.data,
    });
  } catch (error) {
    console.error('Error creating WordPress post:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'An error occurred while creating the WordPress post.',
      error: error.response?.data || error.message,
    });
  }
};
