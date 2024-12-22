import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchApi } from '../firebase';

let apikey = '';
(async () => {
  apikey = await fetchApi(); // Fetch API key inside an IIFE
})();

export const analyzeReportWithAI = async (report) => {
  // Separate questions by type
  const textQuestions = report.questions.filter((q) => q.type === 'text');
  const mcqQuestions = report.questions.filter((q) => q.type === 'mcq');
  const totalQuestions = 10;

  if (totalQuestions === 0) {
    console.warn('No evaluable questions found in the report.');
    return generateEmptyReport(report);
  }

  // Evaluate text questions
  const textEvaluationPromises = textQuestions.map(async (question) => {
    const userAnswer = question.userTextAnswer;

    if (!userAnswer || userAnswer.toLowerCase() === 'n/a') {
      return { ...question, isCorrect: false }; // Unanswered questions are marked incorrect
    }

    try {
      const evaluation = await evaluateTextAnswerAI(question.question, userAnswer);
      question.isCorrect = evaluation === 'correct';
      question.aiEvaluation = evaluation; // Store AI evaluation
      return question;
    } catch (error) {
      console.error(`Error evaluating text question ID: ${question.id}`, error);
      return { ...question, isCorrect: false };
    }
  });

  // Evaluate MCQ questions
  mcqQuestions.forEach((question) => {
    question.isCorrect = question.userAnswer === question.correctAnswer;
  });

  // Combine all evaluations
  const evaluatedTextQuestions = await Promise.all(textEvaluationPromises);
  const evaluatedQuestions = [...evaluatedTextQuestions, ...mcqQuestions];

  // Aggregate results
  const correctAnswers = evaluatedQuestions.filter((q) => q.isCorrect).length;
  const mcqCorrect = mcqQuestions.filter((q) => q.isCorrect).length;
  const textCorrect = evaluatedTextQuestions.filter((q) => q.isCorrect).length;

  const scorePercentage = (correctAnswers / totalQuestions) * 100;
  const employabilityScore = calculateEmployabilityScore(scorePercentage);

  const feedback = await generateAIReportFeedback(report, scorePercentage, correctAnswers, totalQuestions);

  // Final report
  const finalReport = {
    totalQuestions,
    correctAnswers,
    mcqCorrect,
    textCorrect,
    scorePercentage: parseFloat(scorePercentage.toFixed(2)),
    employabilityScore,
    feedback,
    suggestions: generateSuggestions(scorePercentage),
    additionalNotes: generateAdditionalNotes(scorePercentage),
    aiWords: generateAiWords(scorePercentage),
    fakePercentage: calculateFakePercentage(report),
    isHuman: determineIfHuman(report),
    timestamp: new Date(),
    headers: report.headers || [],
    urls: report.urls || [],
    questions: evaluatedQuestions, // Include evaluated questions with `isCorrect` field
  };

  return finalReport;
};

// Helper Functions

/**
 * Evaluate text answers using AI.
 */
const evaluateTextAnswerAI = async (question, userAnswer) => {
  const genAI = new GoogleGenerativeAI(apikey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
  Evaluate the user's answer to the given question and respond with "correct" or "wrong" only.
  Consider the answer correct even if partially correct.

  Examples:
  Question: "What is the capital of India?"
  User's Answer: "New Delhi is the capital of India."
  Response: "correct"

  Question: "What is the capital of India?"
  User's Answer: "India is the capital of India."
  Response: "wrong"

  Now evaluate:
  Question: ${question}
  User's Answer: ${userAnswer}
  Response:
  `;

  try {
    const result = await model.generateContent(prompt);
    const evaluation = result?.response?.text()?.trim().toLowerCase() || 'wrong';
    return evaluation;
  } catch (error) {
    console.error('Error in AI evaluation:', error.message);
    return 'wrong'; // Default to wrong in case of failure
  }
};

// Additional helper functions remain unchanged
// ...


/**
 * Function to generate AI-based feedback based on performance
 * @param {Object} report - The report object
 * @param {number} scorePercentage - The user's score percentage
 * @param {number} correctAnswers - Number of correct answers
 * @param {number} totalQuestions - Total number of questions evaluated
 * @returns {Promise<string>} - Feedback message
 */
const generateAIReportFeedback = async (
  report,
  scorePercentage,
  correctAnswers,
  totalQuestions
) => {
  const maxRetries = 3; // Maximum number of retries
  const delayBetweenRetries = 2000; // Delay in milliseconds between retries (2 seconds)
  
  // Helper function to delay execution for a specified time
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const query = `User answered ${correctAnswers} out of ${totalQuestions} questions correctly, resulting in a score of ${scorePercentage}%. The user had the following job expectations: ${JSON.stringify(report.expectations)}. Provide performance feedback and suggest areas to study if necessary.`;

    try {
      const genAI = new GoogleGenerativeAI(apikey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(query);

      // console.log('Raw AI Feedback Result:', result); // Debug log

      let feedback = 'Could not generate feedback.';
      if (result && result.response && result.response.text()) {
        feedback = result.response.text().trim();
      } else {
        console.error('AI feedback generation failed. No valid response:', result);
      }
      return feedback;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      // If it is the last attempt, throw the error after retries are exhausted
      if (attempt === maxRetries) {
        console.error('Max retries reached. Returning default response.');
        return 'Error generating feedback. Please try again.'; // Return fallback message after all retries fail
      }

      // Wait before retrying
      console.log(`Retrying in ${delayBetweenRetries / 1000} seconds...`);
      await delay(delayBetweenRetries);
    }
  }
};


/**
 * Helper function to calculate employability score based on score percentage
 * @param {number} scorePercentage - The user's score percentage
 * @returns {string} - 'High', 'Medium', or 'Low'
 */
const calculateEmployabilityScore = (scorePercentage) => {
  if (scorePercentage >= 70) return 'High';
  if (scorePercentage >= 50) return 'Medium';
  return 'Low';
};

/**
 * Helper function to generate suggestions based on score percentage
 * @param {number} scorePercentage - The user's score percentage
 * @returns {Array<string>} - Array of suggestion strings
 */
const generateSuggestions = (scorePercentage) => {
  if (scorePercentage >= 90) {
    return ['Maintain your excellent performance!', 'Consider mentoring others.'];
  } else if (scorePercentage >= 70) {
    return ['Focus on weaker areas to achieve higher scores.', 'Practice more MCQ questions.'];
  } else if (scorePercentage >= 50) {
    return ['Review all topics thoroughly.', 'Seek additional resources or tutoring.'];
  } else {
    return [
      'Revisit the course material.',
      'Engage in intensive study sessions.',
      'Consider professional guidance.',
    ];
  }
};

/**
 * Helper function to generate additional notes based on score percentage
 * @param {number} scorePercentage - The user's score percentage
 * @returns {string} - Additional notes
 */
const generateAdditionalNotes = (scorePercentage) => {
  if (scorePercentage >= 90) {
    return 'Outstanding performance! Keep up the great work.';
  } else if (scorePercentage >= 70) {
    return 'Good effort. A little more focus can lead to even better results.';
  } else if (scorePercentage >= 50) {
    return 'You are making progress, but there is room for improvement.';
  } else {
    return 'It appears that you are struggling with the material. Consider seeking help.';
  }
};

/**
 * Helper function to generate aiWords based on score percentage
 * @param {number} scorePercentage - The user's score percentage
 * @returns {string} - Descriptive word for performance
 */
const generateAiWords = (scorePercentage) => {
  if (scorePercentage >= 90) {
    return 'Exceptional';
  } else if (scorePercentage >= 70) {
    return 'Proficient';
  } else if (scorePercentage >= 50) {
    return 'Basic';
  } else {
    return 'Needs Improvement';
  }
};

/**
 * Simulated function to calculate fakePercentage
 * @param {Object} report - The report object
 * @returns {number} - Fake percentage (fixed for testing)
 */
const calculateFakePercentage = (report) => {
  // In a real scenario, implement logic to determine fakePercentage
  return 0; // Fixed value for testing purposes
};

/**
 * Simulated function to determine if the report is human-generated
 * @param {Object} report - The report object
 * @returns {boolean} - True if human-generated, else false
 */
const determineIfHuman = (report) => {
  // In a real scenario, implement logic to verify if the report is human-generated
  return true; // Fixed value for testing purposes
};

/**
 * Helper function to generate an empty report when no questions are present
 * @param {Object} report - The original report object
 * @returns {Object} - Empty report object
 */
const generateEmptyReport = (report) => ({
  totalQuestions: 0,
  correctAnswers: 0,
  mcqCorrect: 0,
  textCorrect: 0,
  scorePercentage: 0,
  employabilityScore: 'Low',
  feedback: 'No questions were evaluated.',
  suggestions: [],
  additionalNotes: '',
  aiWords: null,
  fakePercentage: null,
  isHuman: null,
  timestamp: new Date(), // Add timestamp for record-keeping
  headers: report.headers || [], // Include headers from the original report
  urls: report.urls || [], // Include URLs from the original report
});
