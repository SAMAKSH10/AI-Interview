import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the path as necessary to import your Firestore db instance
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchApi } from '../firebase';

let apikey ='';
(async () => {
  apikey = await fetchApi(); // Fetch API key inside an IIFE
})();


export const fetchQuestionsBySkills = async (skills) => {
  try {
    const allQuestions = [];
    const corporateQuestions = [];
    const techQuestions = [];

    // Split skills into chunks of 30
    for (let i = 0; i < skills.length; i += 30) {
      const limitedSkills = skills.slice(i, i + 30);
      console.log(`Skills chunk: ${limitedSkills}`);

      const q = query(collection(db, "questions"), where("skills", "array-contains-any", limitedSkills));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const questionData = { id: doc.id, ...doc.data() };

        // Simple keyword or tag-based filter for corporate-related questions
        const isCorporate = questionData.skills.some((skill) =>
          ["corporate"].includes(skill.toLowerCase())
        );

        if (isCorporate && corporateQuestions.length < 5) {
          corporateQuestions.push(questionData);
        } else if (!isCorporate && techQuestions.length < 10) {
          techQuestions.push(questionData);
        }
      });

      // Break early if quotas are fulfilled
      if (corporateQuestions.length >= 5 && techQuestions.length >= 10) break;
    }

    // Generate additional questions if quotas are not met
    const additionalTechQuestions = techQuestions.length < 10
      ? await generateAdditionalQuestionsAI(skills, 10 - techQuestions.length)
      : [];

    console.log([...techQuestions, ...additionalTechQuestions, ...corporateQuestions]);
    return [...techQuestions, ...additionalTechQuestions, ...corporateQuestions];
  } catch (error) {
    console.error("Error fetching questions: ", error);
    throw error;
  }
};


export const generateAdditionalQuestionsAI = async (skills, limit) => {
  const genAI = new GoogleGenerativeAI(apikey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Here are skills: ${skills}. Generate exactly ${limit} hardest technical questions and it should not involve writting code. In the format Ques:question generated`;

  try {
    const result = await model.generateContent(prompt);
    //console.log("Full AI Response:", result); // Log the entire response

    // Ensure result has candidates and access the response text
    const responseText = result.response?.text?.() || '';
   // console.log("AI Response Text: ", responseText);

    // Use regex to extract questions based on the expected format
    const questionsArray = responseText
  .split('\n') // Split the response text by new lines
  .filter(line => typeof line === 'string' && line.trim().startsWith('Ques:')) // Ensure valid string and filter lines
  .map((line, index) => {
    // Extract the question text using regex
    const match = line.match(/^Ques:\s?(.*)$/);
    const question = match && typeof match[1] === 'string' ? match[1].trim() : 'Unknown question'; // Fallback if regex fails

    return {
      id: `generated_${index + 1}`, // Unique ID
      question, // Clean question text
      userAnswer: '', // Placeholder for user answers
      userTextAnswer: '', // Placeholder for textual answers
      type: 'text', // Default question type
      skills: 'additional', // Default or dynamic skill category
      isCorrect: null, // Placeholder for correctness
    };
  })
  .slice(0, limit); // Limit the number of questions extracted

    //console.log("Extracted questions:", questionsArray);
    return questionsArray;
  } catch (error) {
    console.error("Error generating questions with AI: ", error);
    return []; // Return an empty array on error
  }
};