import React, { useState } from 'react';
import ResumeUpload from './Parsing'; // Ensure the correct import path
import { AiOutlineCheckCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

const UserDetailsModal = ({ setUserDetails, setResumeData, onClose }) => {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  

  const handleResumeUploadComplete = (success, data) => {
    setLoading(false);
    if (success) {
      setResumeData(data);
      setParsedData(data);
      setResumeUploaded(true);
      // Automatically close the modal after 2 seconds
      setTimeout(() => {
        setUserDetails({ name: null, email: null }); // Adjust as needed
        onClose();
      }, 2000); // 2-second delay
    } else {
      // Handle upload failure if necessary
      alert('Failed to upload resume. Please try again.');
    }
  };

  const handleResumeUploadStart = () => {
    setLoading(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 w-full h-full bg-[url('.\assets\image3.png')] bg-cover">
      <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-lg p-8 w-fit max-w-full z-10 cursor-pointer shadow-gray-900">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          One Step Closer to Your Dream Offer
          <div className="text-center text-sm mt-2 text-gray-800">
            Take a step ahead in your career
          </div>
        </h2>

        <div className="mb-6 justify-center items-center">
          <ResumeUpload
            onUploadStart={handleResumeUploadStart}
            onUploadComplete={handleResumeUploadComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
