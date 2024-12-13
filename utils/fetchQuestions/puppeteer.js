
const puppeteer = require('puppeteer');

async function fetchQuestions(keyword, hl, gl) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}`;
  const browser = await puppeteer.launch({ headless: true }); // Launching in headless mode
  const questions = [];

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the related questions to load
    await page.waitForSelector('.related-question-pair', { timeout: 5000 });

    // Select and extract text from each question element
    const initialQuestions = await page.$$('.related-question-pair');

    for (let element of initialQuestions) {
      const text = await element.evaluate(el => el.innerText.trim());
      questions.push(text); // Only save the initial question
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