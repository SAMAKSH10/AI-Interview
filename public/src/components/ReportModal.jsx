// src/components/ReportModal.jsx
import React, { useState } from "react";
import { AiOutlineClose, AiOutlineDown, AiOutlineUp } from "react-icons/ai";

const SectionCard = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg transition-all duration-300">
      <div
        className="bg-gray-600 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

const ReportModal = ({
  isOpen,
  onClose,
  report,
  questionsData,
  namee,
  email,
  resName,
  resEmail,
  resumeData,
}) => {
  if (!isOpen) return null;

  const aiAnalysis = report?.aiAnalysis || {};
  const expectations = report?.expectations || {};

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 text-gray-300 rounded-lg shadow-2xl max-w-4xl w-full mx-4 sm:mx-0 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 border-b border-gray-600">
          <div className="flex justify-between items-center p-6">
            <h2 className="text-3xl font-bold text-white">Detailed Report</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none transition-colors duration-300"
              aria-label="Close Report Modal"
            >
              <AiOutlineClose className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* <SectionCard title="Basic Information" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <span className="font-semibold">Name:</span> {namee}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {email}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-semibold">Resume Name:</span> {resName}
                </p>
                <p>
                  <span className="font-semibold">Resume Email:</span>{" "}
                  {resEmail}
                </p>
              </div>
            </div>
          </SectionCard> */}

          {resumeData && (
            <SectionCard title="Resume Details" defaultOpen={true}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-indigo-600 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Experience</h4>
                  {resumeData.experience.map((exp, index) => (
                    <p key={index} className="mb-1">
                      {exp}
                    </p>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Education</h4>
                  {resumeData.education.map((edu, index) => (
                    <p key={index} className="mb-1">
                      {edu}
                    </p>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Projects</h4>
                  {resumeData.projects.map((project, index) => (
                    <p key={index} className="mb-1">
                      {project}
                    </p>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Job Expectations">
            <p>
              <span className="font-semibold">Salary:</span>{" "}
              {expectations.salary || "Not specified"}
            </p>
            <p>
              <span className="font-semibold">Career Growth:</span>{" "}
              {expectations.careerGrowth || "Not specified"}
            </p>
            <p>
              <span className="font-semibold">Learning Opportunities:</span>{" "}
              {expectations.learningOpportunities || "Not specified"}
            </p>
          </SectionCard>

          <SectionCard title="Performance Summary" defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-500 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {aiAnalysis.scorePercentage || 0}%
                </p>
                <p className="text-sm">Score</p>
              </div>
              <div className="bg-purple-500 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {aiAnalysis.employabilityScore || "N/A"}
                </p>
                <p className="text-sm">Employability Score</p>
              </div>
              <div className="bg-pink-500 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {aiAnalysis.correctAnswers || 0}/
                  {10}
                </p>
                <p className="text-sm">Correct Answers</p>
              </div>
            </div>
            <p className="mt-4">
              <span className="font-semibold">AI Assessment:</span>{" "}
              {aiAnalysis.aiWords || "Not Available"}
            </p>
          </SectionCard>

          <SectionCard title="Feedback">
            <p>{report?.feedback || "No feedback available."}</p>
          </SectionCard>

          {aiAnalysis.additionalNotes && (
            <SectionCard title="Additional Notes">
              <p>{aiAnalysis.additionalNotes}</p>
            </SectionCard>
          )}

          {report?.suggestions && report.suggestions.length > 0 && (
            <SectionCard title="Suggestions for Improvement">
              <ul className="list-disc list-inside space-y-2">
                {report.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </SectionCard>
          )}

<SectionCard title="Questions and Answers">
            {questionsData.length === 0 ? (
              <p className="text-center">No questions available to display.</p>
            ) : (
              <div className="space-y-4">
                {questionsData.map((question, index) => (
                  <div key={index} className={` text-gray-100 ${!question.skills.includes('Corporate')?(!question.isCorrect ?('bg-red-700'):('bg-green-700')):('bg-gray-600')} p-4 rounded-lg`}>
                    <h4 className="text-lg font-medium mb-2">
                      {index + 1}.{" "}
                      {question.question || " No question available"}
                    </h4>
                    <p>
                      <span className="font-semibold">Your Answer:</span>{" "}
                      {question.userAnswer || question.userTextAnswer || "Not Answered"}
                    </p>
                    
                     {/* {question.correctAnswer && (
                      <p>
                      <span className="font-semibold">Correct Answer:</span>{" "}
                      {question.correctAnswer}
                    </p>
                     )} */}
                    
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>

       
      </div>
    </div>
  );
};

export default ReportModal;