// src/components/ResumeUpload.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
  AiOutlineCloudUpload,
  AiOutlineCheckCircle,
  AiOutlineLoading3Quarters,
} from 'react-icons/ai';
import skillsContext from '../Context/skills';
import { uploadResumeData, uploadResumeFile } from '../firebaseUtils';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import skillsList from './skills';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ResumeUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const { setSkills, skills } = useContext(skillsContext); // Access both setSkills and current skills
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // New state variables for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const navigate = useNavigate();

  // Load draft from localStorage on component mount
  useEffect(() => {
    const draft = JSON.parse(localStorage.getItem('resumeDraft'));
    if (draft && draft.selectedFile && draft.skills) {
      setSelectedFile(draft.selectedFile);
      setSkills((prevSkills) => ({
        ...prevSkills,
        skills: draft.skills,
      }));
    }
  }, [setSkills]);

  // Save draft to localStorage whenever selectedFile or extractedData changes
  useEffect(() => {
    const draft = {
      selectedFile,
      skills: extractedData ? extractedData.skills : skills.skills, // Use existing skills if no extractedData
    };
    localStorage.setItem('resumeDraft', JSON.stringify(draft));
  }, [selectedFile, extractedData, skills.skills]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError(
        'Invalid file type or size. Please upload a PDF or DOCX file under 5MB.'
      );
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError(
        'Invalid file type or size. Please upload a PDF or DOCX file under 5MB.'
      );
      setSelectedFile(null);
    }
  };

  const validateFile = (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file && validTypes.includes(file.type) && file.size <= maxSize) {
      return true;
    }
    return false;
  };

  const handleResumeUpload = async () => {
    if (!selectedFile) {
      setError('Please select a valid resume file to upload.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let extractedText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        extractedText += pageText + '\n';
      }

      const parsedData = parseResumeText(extractedText);
      parsedData.skills.push('Corporate'); // Existing functionality
      setExtractedData(parsedData);

      setSkills({
        ...skills,
        skills: parsedData.skills, // Update only the skills array
        name: parsedData.name,
        email: parsedData.contact.email,
        phone: parsedData.contact.phone,
        experience: parsedData.experience,
        education: parsedData.education,
        projects: parsedData.projects,
        certifications: parsedData.certifications,
      });

      console.log('Extracted Resume Data:', parsedData);
      setIsParsing(false);

      // Proceed to upload
      await uploadResume(parsedData);
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to extract data from the PDF. Please try again.');
      setIsParsing(false);
      onUploadComplete(false);
    }
  };

  const uploadResume = async (parsedData) => {
    setIsUploading(true);
    setError(null);
    try {
      // Upload resume file
      const resumePath = await uploadResumeFile(parsedData.contact.email, selectedFile);
      console.log('Resume path:', resumePath);

      // Upload parsed data to Firestore
      await uploadResumeData(parsedData.contact.email, parsedData.contact.email, {
        ...parsedData,
        resumePath, // Include the uploaded file path
      });

      console.log('Resume data uploaded to Firebase');
      setIsUploading(false);
      setUploadSuccess(true);
      onUploadComplete(true, parsedData);

      // Clear draft from localStorage
      localStorage.removeItem('resumeDraft');
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to upload resume. Please try again.');
      setIsUploading(false);
      onUploadComplete(false);
    }
  };

  const handleSubmit = () => {
    handleResumeUpload();
  };

  const parseResumeText = (text) => {
    return {
      name: extractName(text),
      contact: extractContactInfo(text),
      skills: extractSkills(text),
      experience: extractExperience(text),
      education: extractEducation(text),
      projects: extractProjects(text),
      certifications: extractCertifications(text),
    };
  };

  const extractName = (text) => {
    const nameMatch = text.match(
      /(?:Name|Personal Details|Contact Info|About Me|Summary)?\s*([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/i
    );
    return nameMatch && nameMatch[1] ? nameMatch[1].trim() : 'Name not found';
  };

  const extractContactInfo = (text) => {
    const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    const phone = text.match(
      /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/
    );
    return {
      email: email ? email[0] : 'No email found',
      phone: phone ? phone[0] : 'No phone number found',
    };
  };

  const extractSkills = (text) => {
    const skillsSectionMatch = text.match(
      /(?:skills|technical skills|key skills|core competencies)[\s\S]*?(?=experience|education|projects|certifications|$)/i
    );
    let skills = [];

    if (skillsSectionMatch) {
      const skillsSection = skillsSectionMatch[0];
      const extractedSkills = skillsSection
        .replace(/(skills|technical skills|key skills|core competencies):?/i, '')
        .split(/[,|•\n]/)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      skills = Array.from(new Set([...extractedSkills, 'Corporate']));
    } else {
      skills = ['Corporate']; // Default if no skills section found
    }

    // **Added Functionality**: Scan the entire resume for additional skills
    const additionalSkills = scanEntireResumeForSkills(text);

    // Combine and ensure uniqueness
    const combinedSkills = Array.from(
      new Set([...skills, ...additionalSkills, 'Corporate'])
    );

    // Ensure 'Corporate' is at the front
    const finalSkills = combinedSkills.filter(
      (skill) => skill.toLowerCase() !== 'corporate'
    );
    finalSkills.unshift('Corporate');

    return finalSkills.length > 0 ? finalSkills : ['Corporate'];
  };

  // **New Function**: Scan the entire resume text for skills from skills.js
  const scanEntireResumeForSkills = (text) => {
    // Convert text to lowercase for case-insensitive matching
    const lowerCaseText = text.toLowerCase();

    // Initialize an array to hold matched skills
    let matchedSkills = [];

    // Iterate through each skill in skillsList and check if it exists in the text
    skillsList.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      // Use word boundaries to ensure exact matches
      const regex = new RegExp(`\\b${escapeRegExp(skillLower)}\\b`, 'i');
      if (regex.test(lowerCaseText)) {
        matchedSkills.push(skill);
      }
    });

    return matchedSkills;
  };

  const extractExperience = (text) => {
    const experiencePattern = /experience[\s\S]*?(projects|education)/i;
    const experienceMatch = text.match(experiencePattern);
    if (experienceMatch && experienceMatch[0]) {
      const experienceText = experienceMatch[0].replace(/(projects|education)/i, '').trim();
      const experiences = experienceText.split(/[\n•]+/).filter((e) => e.trim());
      return experiences.length ? experiences : ['No experience found'];
    }
    return ['No experience found'];
  };

  const extractEducation = (text) => {
    const educationPattern = /education[\s\S]*?(projects|certifications)/i;
    const educationMatch = text.match(educationPattern);
    if (educationMatch && educationMatch[0]) {
      const educationText = educationMatch[0].replace(/(projects|certifications)/i, '').trim();
      const education = educationText.split(/[\n•]+/).filter((e) => e.trim());
      return education.length ? education : ['No education found'];
    }
    return ['No education found'];
  };

  const extractProjects = (text) => {
    const projectsPattern = /projects[\s\S]*?(certifications|co-curricular|achievements|$)/i;
    const projectsMatch = text.match(projectsPattern);
    if (projectsMatch && projectsMatch[0]) {
      const projectsText = projectsMatch[0].replace(/(certifications|co-curricular|achievements)/i, '').trim();
      const projects = projectsText.split(/[\n•]+/).filter((p) => p.trim());
      return projects.length ? projects : ['No projects found'];
    }
    return ['No projects found'];
  };

  const extractCertifications = (text) => {
    const certificationsPattern = /certifications[\s\S]*/i;
    const certificationsMatch = text.match(certificationsPattern);
    if (certificationsMatch && certificationsMatch[0]) {
      const certificationsText = certificationsMatch[0].replace(/(co-curricular|achievements)/i, '').trim();
      const certifications = certificationsText.split(/[\n•]+/).filter((c) => c.trim());
      return certifications.length ? certifications : ['No certifications found'];
    }
    return ['No certifications found'];
  };

  // Helper function to escape special characters in regex
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;
      setShowLoginModal(false); // Close modal
      navigate(`/${user.uid}/admin`); // Redirect to '/id/admin'
    } catch (error) {
      let errorMessage = 'Failed to login. Please check your credentials.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        // Add more cases as needed
        default:
          break;
      }
      setLoginError(errorMessage);
      console.error('Login error:', error);
    }
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
  };

  return (
    <div className="bg-white rounded-md p-8 shadow-sm max-w-2xl mx-auto mt-10">
      <p className="text-gray-800 font-semibold mb-6">
        Start your dream by uploading resume
      </p>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed border-gray-900 rounded-md p-8 mt-4 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-gray-100 transition-colors ${
          isUploading || isParsing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() =>
          !isUploading && !isParsing && document.getElementById('resumeInput').click()
        }
      >
        <AiOutlineCloudUpload className="w-16 h-16 text-gray-800" />
        <p className="text-gray-600 mt-4 text-center">
          Drag your resume here or click to upload
        </p>
        <span className="text-sm text-gray-500">
          Acceptable file types: PDF, DOCX (5MB max)
        </span>
        <input
          type="file"
          id="resumeInput"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isParsing}
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mt-6 flex items-center">
          <AiOutlineCheckCircle className="w-6 h-6 text-green-500 mr-3" />
          <span className="text-green-600 font-medium">
            Selected File: {selectedFile.name}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-100 text-red-600 px-5 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mt-6 bg-green-100 text-green-600 px-5 py-3 rounded-md">
          Resume uploaded and parsed successfully!
        </div>
      )}

      {/* Parsing Stage Indicator */}
      {isParsing && (
        <div className="mt-4 flex items-center">
          <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
          <span>Parsing...</span>
        </div>
      )}

      {/* Removed Keywords Input Section */}
      {/* 
      <div className="mt-8">
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-800 mb-2">
          Add Keywords to Highlight Your Skills
        </label>
        <input
          type="text"
          id="keywords"
          className="block w-full rounded-md border-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 text-gray-600 bg-gray-100"
          placeholder="Type your tags here, separated by commas..."
          value={skills.skills.join(', ')} // Display current skills
          onChange={(e) => {
            const updatedSkills = e.target.value.split(',').map((kw) => kw.trim()).filter((kw) => kw);
            setSkills({
              ...skills,
              skills: updatedSkills,
            });
          }}
          disabled={isUploading || isParsing}
        />
      </div>
      */}

      {/* Action Buttons */}
      <div className="mt-8 flex space-x-4">
        <button
          className="inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={openLoginModal}
        >
          Login as Admin
        </button>
        <button
          onClick={handleSubmit}
          className={`inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isUploading || isParsing
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          disabled={isUploading || isParsing}
        >
          {isUploading || isParsing ? (
            <>
              <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
              {isParsing ? 'Parsing...' : 'Uploading...'}
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-md shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Admin Login</h2>
            {loginError && (
              <div className="bg-red-100 text-red-600 p-3 rounded-md mb-4">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-800 pb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 outline-none focus:outline-blue-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 pb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 outline-none focus:outline-blue-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-3 bg-gray-600 text-white px-4 py-2 rounded-md"
                  onClick={closeLoginModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
