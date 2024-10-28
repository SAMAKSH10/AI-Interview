// testFetchQuestions.js

import { fetchQuestionsBySkills } from './components/fetchQuestions'; // Path to your fetchQuestionsBySkills function
 // Ensure Firebase is correctly initialized

// Define some mock skills to test the function
const mockSkills = ["JavaScript", "React"];

// Run the test
const runTest = async () => {
  try {
    const questions = await fetchQuestionsBySkills(mockSkills);
    console.log('Fetched questions:', questions);
  } catch (error) {
    console.error('Error during test:', error);
  }
};

runTest();
