const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver'); // Ensure chromedriver is required

async function fetchQuestions(keyword, hl, gl) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}`;
  
  // Initialize the Chrome WebDriver
  let driver = await new Builder().forBrowser('chrome').build();
  const questions = [];

  try {
    await driver.get(url);

    // Wait for the related questions to load
    await driver.wait(until.elementsLocated(By.css('.related-question-pair')), 5000);

    // Select and extract text from each question element
    const initialQuestions = await driver.findElements(By.css('.related-question-pair'));

    for (let element of initialQuestions) {
      const text = await element.getText();
      questions.push(text.trim()); // Only save the initial question
    }

    return questions; // Returns an array of initial questions
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  } finally {
    // Close the browser
    await driver.quit();
  }
}

module.exports = fetchQuestions;