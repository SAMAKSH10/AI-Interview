// src/components/ExpectationPage.jsx

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { 
  getTestReportsFromFirebase, 
  getResumeDataFromFirebase, 
  updateTestReportInFirebase 
} from '../firebaseUtils'; 
import skillsContext from '../Context/skills'; 
import { useNavigate } from 'react-router-dom'; 
import { analyzeReportWithAI } from './aiModel'; 
import { 
  AiOutlineLoading3Quarters,  
} from 'react-icons/ai';
import { GoCrossReference } from "react-icons/go";
import Tooltip from './Tooltip'; // Import the Tooltip component
import { collection, query, where, getDocs } from 'firebase/firestore';
import debounce from 'lodash/debounce'; // Import debounce if using it
import backgroundImage from '../assets/image3.png'; // Import the background image
import {db} from '../firebaseConfig'

const ExpectationPage = () => {
  const [report, setReport] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { skills } = useContext(skillsContext);
  const [expectations, setExpectations] = useState({
    salary: '',
    careerGrowth: '',
    learningOpportunities: '',
  });
  // State to manage tooltip visibility and messages for each field
  const [tooltipVisible, setTooltipVisible] = useState({
    salary: false,
    careerGrowth: false,
    learningOpportunities: false,
  });

  const [tooltipMessages, setTooltipMessages] = useState({
    salary: '',
    careerGrowth: '',
    learningOpportunities: '',
  });
  
  const navigate = useNavigate(); 

  // Fetch report and resume data on component mount
  useEffect(() => {
    const fetchReport = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const fetchedReport = await getTestReportsFromFirebase(skills.email);
        setReport(fetchedReport);
        const fetchedResumeData = await getResumeDataFromFirebase(skills.email);
        setResumeData(fetchedResumeData);
      } catch (error) {
        console.error('Error fetching test report:', error);
        setError('Failed to fetch test report or resume data.');
      } finally {
        setIsFetching(false);
      }
    };

    if (skills.email) {
      fetchReport();
    }
  }, [skills.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpectations((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Start submitting

    try {
      // Step 1: Submit expectations and update Firebase
      const updatedReport = {
        ...report,
        expectations,
      };
      await updateTestReportInFirebase(skills.email, updatedReport);

      // Step 2: Call AI API for full analysis
      try {
        const reportData = {
          questions: report.questions, // Array of questions (MCQ + text)
          expectations: updatedReport.expectations, // Expectations provided by the user
        };
    
        // Call the function to analyze the report
        const aiAnalysis = await analyzeReportWithAI(reportData);
        // Log or display the analysis report
        console.log('AI Analysis Report:', aiAnalysis);
        // Add the AI analysis report back to the user's report or save it in your database
        updatedReport.analysis = aiAnalysis;
        const fullReport = {
          ...updatedReport,
          aiAnalysis, // Full analysis from AI
          feedback: aiAnalysis.feedback, // Feedback generated by AI
          suggestions: aiAnalysis.suggestions, // Study suggestions
        };
        await updateTestReportInFirebase(skills.email, fullReport);
        // Step 3: Redirect to final page after full analysis is saved
        navigate('/final',{ replace: true });
      } catch (error) {
        console.error('Error submitting expectations and generating analysis:', error.message);
        setError('Failed to generate AI analysis. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting expectations and generating analysis:', error);
      setError('Failed to submit expectations or generate analysis. Please try again.');
    } finally {
      setIsSubmitting(false); // Stop submitting
    }
  };
  
  // Function to fetch dynamic messages
  const dynamicMessage = useCallback(async (id) => {
    try {
      const q = query(
        collection(db, 'expectationInformation'),
        where('id', '==', id)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data().content;
      } else {
        console.warn(`No content found for id: ${id}`);
        return 'No additional information available.';
      }
    } catch (error) {
      console.error(`Error fetching dynamic message for id ${id}:`, error);
      return 'Error loading information.';
    }
  }, []);

  // Memoized toggleTooltip function
  const toggleTooltip = useCallback(async (field) => {
    if (!tooltipMessages[field]) {
      const message = await dynamicMessage(field);
      setTooltipMessages((prev) => ({ ...prev, [field]: message }));
    }
    setTooltipVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, [dynamicMessage, tooltipMessages]);

  const closeTooltip = useCallback((field) => {
    setTooltipVisible((prev) => ({
      ...prev,
      [field]: false,
    }));
  }, []);

  // Close tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = debounce((event) => {
      const tooltipContainers = document.querySelectorAll('.tooltip-container');
      tooltipContainers.forEach((tooltip) => {
        if (!tooltip.contains(event.target)) {
          const field = tooltip.getAttribute('data-field');
          if (field && tooltipVisible[field]) {
            setTooltipVisible((prev) => ({
              ...prev,
              [field]: false,
            }));
          }
        }
      });
    }, 100);

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      handleClickOutside.cancel(); // Cancel any pending debounced calls
    };
  }, [tooltipVisible]);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <AiOutlineLoading3Quarters className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-center text-red-500 text-xl">{error}</p>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-center text-gray-400 text-xl">No test report available. Please try again later.</p>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-center text-gray-400 text-xl">No resume data available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center p-4 bg-cover text-gray-500 bg-white min-h-screen"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Job Expectations Form */}
      <form 
        className="w-full max-w-2xl mt-8 bg-gradient-to-t from-slate-50 to-white shadow-lg rounded-lg p-8 sm:p-10 md:p-12 shadow-gray-500"
        onSubmit={handleSubmit}
      >
        <h2 className="text-4xl font-bold mb-6 text-gray-900">Job Expectations</h2>
        {/* Salary Expectation */}
        <div 
          className="mb-6 relative group tooltip-container outline-none border-none" 
          data-field="salary"
        >
          <label className="block text-gray-900 mb-2" htmlFor="salary">Salary Expectation</label>
          <input
            type="text"
            name="salary"
            id="salary"
            placeholder="e.g. 3-4 LPA"
            className="w-full p-3 bg-gray-100 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300  transition-colors duration-300"
            value={expectations.salary}
            onChange={handleInputChange}
            required
          />
          {/* Eye Icon with Tooltip */}
          <div className="absolute top-3 right-3 border-none outline-none focus:border-none">
            <button
              type="button"
              onClick={() => toggleTooltip('salary')}
              className="relative group border-none outline-none focus:outline-none "
              aria-label="More information about Salary Expectation"
              aria-haspopup="true"
              aria-expanded={tooltipVisible.salary}
            >
              <GoCrossReference className="h-5 w-5 text-slate-800 hover:text-indigo-500  cursor-pointer outline-none border-none hover:border-none hover:outline-none" />
              {tooltipVisible.salary && tooltipMessages.salary && (
                <Tooltip 
                  message={tooltipMessages.salary}
                  onClose={() => closeTooltip('salary')}
                />
              )}
            </button>
          </div>
        </div>
        
        {/* Career Growth */}
        <div 
          className="mb-6 relative group tooltip-container border-none outline-none" 
          data-field="careerGrowth"
        >
          <label className="block text-gray-900 mb-2" htmlFor="careerGrowth">Career Growth</label>
          <input
            type="text"
            name="careerGrowth"
            id="careerGrowth"
            placeholder="e.g., Opportunities for promotion, skill development"
            className="w-full p-3 bg-gray-100 text-gray-900 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-300"
            value={expectations.careerGrowth}
            onChange={handleInputChange}
            required
          />
          {/* Eye Icon with Tooltip */}
          <div className="absolute top-3 right-3 border-none outline-none focus:outline-none">
            <button
              type="button"
              onClick={() => toggleTooltip('careerGrowth')}
              className="relative group border-none outline-none focus:outline-none"
              aria-label="More information about Career Growth"
              aria-haspopup="true"
              aria-expanded={tooltipVisible.careerGrowth}
            >
              <GoCrossReference className="h-5 w-5 text-slate-900 cursor-pointer  hover:text-indigo-500  focus:outline-none" />
              {tooltipVisible.careerGrowth && tooltipMessages.careerGrowth && (
                <Tooltip 
                  message={tooltipMessages.careerGrowth}
                  onClose={() => closeTooltip('careerGrowth')}
                />
              )}
            </button>
          </div>
        </div>
        
        {/* Learning Opportunities - Dropdown */}
        <div 
          className="mb-6 relative group tooltip-container" 
          data-field="learningOpportunities"
        >
          <label className="block text-gray-900 mb-2" htmlFor="learningOpportunities">Learning Opportunities</label>
          <select
            name="learningOpportunities"
            id="learningOpportunities"
            className="w-full p-3 bg-gray-100 text-gray-500 rounded-lg  focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors duration-300"
            value={expectations.learningOpportunities}
            onChange={handleInputChange}
            required
          >
            <option value="" className='text-gray-500 ' disabled>Select an option</option>
            <option value="Senior Trainer" className='text-gray-800 hover:bg-indigo-500'>Senior Trainer</option>
            <option value="Corporate Training" className='text-gray-800 hover:bg-indigo-500'>Corporate Training</option>
            <option value="AI-Based Training" className='text-gray-800 hover:bg-indigo-500'>AI-Based Training</option>
          </select>
          {/* Eye Icon with Tooltip */}
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={() => toggleTooltip('learningOpportunities')}
              className="relative group border-none outline-none focus:outline-none"
              aria-label="More information about Learning Opportunities"
              aria-haspopup="true"
              aria-expanded={tooltipVisible.learningOpportunities}
            >
              <GoCrossReference className="h-5 w-5 text-slate-900 cursor-pointer hover:text-indigo-500 focus:outline-none" />
              {tooltipVisible.learningOpportunities && tooltipMessages.learningOpportunities && (
                <Tooltip 
                  message={tooltipMessages.learningOpportunities} 
                  onClose={() => closeTooltip('learningOpportunities')}
                />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed outline-none border-none focus:outline-none"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 mr-2" />
              <span>Submitting...</span>
            </>
          ) : (
            'Submit Expectations'
          )}
        </button>
      </form>
    </div>
  );
};
export default ExpectationPage;