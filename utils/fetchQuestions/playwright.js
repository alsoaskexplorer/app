const { chromium } = require('playwright'); // Import Playwright's Chromium browser

async function fetchQuestions(keyword, hl, gl) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}`;

  
  // Launch the browser in headless mode
  const browser = await chromium.launch({ headless: true }); // headless: true is default, but shown here explicitly
  const questions = [];

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the related questions to load
    await page.waitForSelector('.related-question-pair', { timeout: 5000 });

    // Select and extract text from each question element
    const questionElements = await page.$$('.related-question-pair');

    for (let element of questionElements) {
      const text = await element.evaluate(el => el.innerText.trim());
      questions.push(text); // Save each initial question
    }

    return questions; // Returns an array of initial questions
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  } finally {
    // Close the browser
    await browser.close();
  }
}

module.exports = fetchQuestions;
