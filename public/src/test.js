import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchApi } from './firebase';

let apikey ='';
(async () => {
  apikey = await fetchApi(); // Fetch API key inside an IIFE
})();

export const test = async()=>{
 
  try {
    // Ensure the API key is defined
    if (!apikey) {
      throw new Error("API key is not set.");
    }
  
    // Initialize the Generative AI client
    const genAI = new GoogleGenerativeAI(apikey);
  
    // Attempt to retrieve the generative model
    const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
    // Test the model with a sample prompt
    const prompt = "Write a creative story about AI.";
    const response = await model.generateContent(prompt);
  
    // Handle the response
    if (response && response.response.text) {
     return true;
    } else {
      throw new Error("Model response is invalid.");
    }
  } catch (err) {
    // Log the error for debugging
    console.error("Error initializing Generative AI or model:", err);
  }
  
}