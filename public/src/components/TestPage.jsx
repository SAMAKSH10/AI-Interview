import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { startRecording, stopRecording } from "./recorder";
import { fetchQuestionsBySkills } from "./fetchQuestions";
import { saveTestReportToFirebase } from "../firebaseUtils";
import UserDetailsModal from "./UserDetailsModal";
import skillsContext from "../Context/skills";
import {
  AiOutlineLoading3Quarters,
  AiOutlineStop,
  AiOutlinePlayCircle,
} from "react-icons/ai";

const TestPage = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timePerQuestion, setTimePerQuestion] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [textAnswers, setTextAnswers] = useState({});
  const navigate = useNavigate();
  const { skills } = useContext(skillsContext);

  // Fetch questions based on resume skills
  useEffect(() => {
    const fetchQuestions = async () => {
      if (resumeData && resumeData.skills) {
        try {
          const combinedSkills = Array.from(
            new Set([...resumeData.skills, "Corporate"])
          );
          const fetchedQuestions = await fetchQuestionsBySkills(combinedSkills);
          const initializedQuestions = fetchedQuestions.map((question) => ({
            ...question,
            userAnswer: "", // For multiple-choice
            userTextAnswer: "", // For text-based answers
          }));
          setQuestions(initializedQuestions);
        } catch (error) {
          console.error("Error fetching questions:", error);
        }
      }
    };
    fetchQuestions();
  }, [resumeData]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitTest(); // Auto-end test when timer reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  // Start recording when test starts
  useEffect(() => {
    if (testStarted) {
      startRecording();

      setIsRecording(true);
    }
    return () => {
      if (isRecording) {
        stopRecording(skills.email, skills.email);
        setIsRecording(false);
      }
    };
  }, [testStarted]);

  const handleSelectAnswer = (choice) => {
    const currentTime = Date.now();
    const questionTime = currentTime - questionStartTime;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionIndex]: questionTime,
    }));
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, index) =>
        index === currentQuestionIndex
          ? { ...question, userAnswer: choice }
          : question
      )
    );
    setQuestionStartTime(currentTime);
  };

  const handleTextAnswerChange = (e) => {
    const answer = e.target.value;
    setTextAnswers({
      ...textAnswers,
      [currentQuestionIndex]: answer,
    });
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, index) =>
        index === currentQuestionIndex
          ? { ...question, userTextAnswer: answer }
          : question
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    await stopRecording(skills.email, skills.email);
    await saveTestReportToFirebase(
      { userDetails, questions, timePerQuestion, textAnswers },
      skills.email
    );
    setIsSubmitting(false);
    navigate("/expectation");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setIsTimerActive(true);
    setQuestionStartTime(Date.now());
  };

  // Check if the current question is answered
  const isAnswerSelected = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.type === "mcq") {
      return currentQuestion.userAnswer !== ""; // Check if MCQ is selected
    } else {
      return (
        currentQuestion.userTextAnswer &&
        currentQuestion.userTextAnswer.trim() !== ""
      ); // Check if text answer is provided
    }
  };

  // Calculate progress percentage
  const progressPercentage = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  return (
    <div className="p-6 bg-[url('.\assets\image3.png')] bg-cover min-h-screen flex flex-col items-center justify-center font-poppins text-gray-100 transition duration-300">
      {/* User Details Modal */}
      {showModal && (
        <UserDetailsModal
          setUserDetails={setUserDetails}
          setResumeData={setResumeData}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Permission Denied Screen */}
      {permissionDenied ? (
        <div className="bg-red-700 text-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <h2 className="text-3xl font-semibold mb-6">Permission Denied</h2>
          <p className="mb-6">
            Please ensure all required permissions are granted to continue the
            test.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-lg font-medium"
          >
            Return Home
          </button>
        </div>
      ) : testStarted ? (
        // Test Started Screen
        <div className="bg-gradient-to-br from-gray-50 to-white text-gray-800 rounded-lg shadow-xl p-10 max-w-3xl w-full relative shadow-gray-500">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Timer and Recording Controls */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Time Remaining: {formatTime(timer)}
            </h2>
            <div className="flex items-center space-x-4">
              {isRecording ? (
                <button
                  onClick={() => location.reload()}
                  className="flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition text-lg font-medium border-none outline-none focus:outline-red-600"
                  aria-label="Stop Recording and Submit Test"
                >
                  <AiOutlineStop className="w-6 h-6 mr-3 outline-none focus:outline-red-600 border-none" />
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={() => {
                    startRecording();
                    setIsRecording(true);
                  }}
                  className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
                  aria-label="Start Recording"
                >
                  <AiOutlinePlayCircle className="w-6 h-6 mr-3" />
                  Start Recording
                </button>
              )}
            </div>
          </div>

          {/* Question Section */}
          {questions.length > 0 ? (
            <div className="space-y-8">
              <div className="fade-in">
                <h3 className="font-semibold text-2xl mb-6">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h3>
                <p className="text-xl mb-6 font-medium">
                  {questions[currentQuestionIndex]?.question}
                </p>

                {/* Render based on question type */}
                {questions[currentQuestionIndex]?.type !== "mcq" ? (
                  // Render Textarea for Non-MCQ Questions
                  <div>
                    <label
                      htmlFor="textAnswer"
                      className="block text-lg font-medium text-gray-900 mb-2"
                    >
                      Your Answer:
                    </label>
                    <textarea
                      id="textAnswer"
                      rows="4"
                      className="w-full p-4 bg-gray-100 rounded-lg text-gray-800 mt-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={textAnswers[currentQuestionIndex] || ""}
                      onChange={handleTextAnswerChange}
                      placeholder="Type your answer here..."
                    />
                  </div>
                ) : (
                  // Render Multiple Choice Answers
                  <div className="space-y-4">
{questions[currentQuestionIndex].choices.map((choice, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectAnswer(choice)}
                          className={`cursor-pointer p-4 rounded-lg border transition ${
                            questions[currentQuestionIndex].userAnswer === choice
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {choice}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <div className="flex justify-between mt-10">
                {!(currentQuestionIndex === questions.length - 1)&&(
                  <button
                  onClick={handleNextQuestion}
                  disabled={!isAnswerSelected()}
                  className={`px-6 py-3 rounded-lg text-lg font-medium transition border-none focus:outline-none outline-none ${
                    isAnswerSelected()
                      ? "bg-blue-600 hover:bg-blue-700 focus:outline-blue-400 text-white"
                      : "bg-gray-400 cursor-not-allowed text-white"
                  }`}
                >
                  Next
                </button>
                ) }

                {/* Submit Button */}
                {(currentQuestionIndex === questions.length - 1)&& (
                  <button
                    onClick={handleSubmitTest}
                    disabled={isSubmitting || !isAnswerSelected()}
                    className={`px-6 py-3 rounded-lg text-lg font-medium transition text-white ${
                      isSubmitting && !isAnswerSelected()
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSubmitting ? ("Submitting..." ):( "Submit Test")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center mt-10">
              <AiOutlineLoading3Quarters className="animate-spin w-8 h-8 text-gray-600" />
              <span className="ml-4 text-lg text-gray-700">
                Loading Questions...
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
        {resumeData && (
          <div className="bg-white  text-gray-800  p-10 max-w-3xl w-full text-center rounded-lg shadow-lg ">
          {/* Title Section */}
          <h1 className="text-4xl font-semibold mb-10 mt-3">
            Welcome to the Skill Assessment Test
          </h1>

          {/* Warnings and Precautions Section */}
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
            <h2 className="text-xl font-semibold">⚠️ Important Warnings:</h2>
            <ul className="mt-6 text-sm text-left list-disc list-inside space-y-2">
              <li>
                No external devices or assistance is allowed during the test.
              </li>
              <li>
                Switching tabs or windows will be flagged as suspicious
                activity.
              </li>
              <li>Any form of cheating will result in disqualification.</li>
            </ul>
          </div>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
            <h2 className="text-xl font-semibold">
              🛡️ Precautions Before Starting:
            </h2>
            <ul className="mt-6 space-y-2 text-sm text-left list-disc list-inside">
              <li>
                Ensure your webcam and microphone are functioning properly.
              </li>
              <li>Make sure you have a stable internet connection.</li>
              <li>Find a quiet, well-lit environment for the test.</li>
            </ul>
          </div>

          {/* Start Test Button */}
          <button
            onClick={handleStartTest}
            className="mt-6 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition text-xl font-medium border-none outline-none focus:outline-none"
          >
            Start Test
          </button>
        </div>
        )}
        </>
        
      )}
    </div>
  );
};

export default TestPage;
