const axios = require('axios'); // Import Axios for HTTP requests
const cheerio = require('cheerio'); // Import Cheerio for HTML parsing

async function fetchQuestions(keyword, hl, gl) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}`;

  try {
    // Make an HTTP GET request to the Google search URL
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
      },
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);
    const questions = [];

    // Select and extract text from each question element
    $('.related-question-pair').each((index, element) => {
      const text = $(element).text().trim(); // Get the text content of the element
      questions.push(text); // Save each initial question
    });

    return questions; // Returns an array of initial questions
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  }
}

module.exports = fetchQuestions;