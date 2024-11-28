// src/components/Final.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import skillsContext from '../Context/skills';
import { getTestReportsFromFirebase,updateTestReportInFirebase2 } from '../firebaseUtils';
import { db,storage } from '../firebaseConfig';
import ReportModal from './ReportModal'; // Import the ReportModal component
import { AiOutlineLoading3Quarters, AiOutlineEye } from 'react-icons/ai';
import jsPDF from "jspdf";

const Final = () => {
  const { skills } = useContext(skillsContext);
  const [questionsData, setQuestionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null); // State for report
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility


  useEffect(() => {
    const fetchData = async () => {
      if (!skills || !skills.email) {
        console.log('Skills data is missing or incomplete.');
        setLoading(false);
        return;
      }

      try {
        const reportData = await getTestReportsFromFirebase(skills.email);

        if (reportData) {
          setQuestionsData(reportData.questions || []);
          setReport(reportData); // Store report data in state
          console.log('Fetched data:', reportData);
        } else {
          console.log('No such document found for the user.');
        }
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [skills]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <AiOutlineLoading3Quarters className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }

  if (!skills || !skills.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-center text-gray-400 text-xl">
          Skills data is missing or incomplete.
        </p>
      </div>
    );
  }


const generatePDFReport = async () => {
  const reportData = report;
  if (!questionsData || questionsData.length === 0) {
    alert("No report data available to generate the report.");
    return;
  }

  if (!report) {
    console.error("Report data is not defined.");
    alert("Report data is not available.");
    return;
  }

   // Extract data
   const aiAnalysis = reportData.aiAnalysis || {};
   const expectations = reportData.expectations || {};
   const suggestions = reportData.suggestions || [];
 

  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20; // Margin for content
    let cursorY = margin;

    // Function to handle page overflow
    const checkPageOverflow = (lineHeight = 10) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin; // Reset to top margin for the new page
      }
    };

    // Function to wrap and render text
    const renderWrappedText = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        checkPageOverflow(10);
        doc.text(line, x, cursorY);
        cursorY += 10;
      });
    };

    // Function to draw headers
    const drawSectionHeader = (text) => {
      checkPageOverflow(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor("#283593");
      doc.text(text, margin, cursorY);
      cursorY += 8;
      doc.setDrawColor(204, 204, 204);
      doc.line(margin, cursorY, pageWidth - margin, cursorY); // Underline
      cursorY += 10;
    };

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#1A237E");
    doc.text("Performance Report", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 30;

    // Basic Information
    drawSectionHeader("Basic Information");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    renderWrappedText(
      `Score: ${aiAnalysis.correctAnswers || 0} out of ${aiAnalysis.totalQuestions || 0} questions (${aiAnalysis.scorePercentage || 0}%)`,
      margin,
      cursorY,
      pageWidth - 2 * margin
    );
    renderWrappedText(
      `Employability Score: ${aiAnalysis.employabilityScore || "Not Available"}`,
      margin,
      cursorY,
      pageWidth - 2 * margin
    );
    renderWrappedText(
      `AI Assessment: ${aiAnalysis.aiWords || "Not Available"}`,
      margin,
      cursorY,
      pageWidth - 2 * margin
    );
    cursorY+=15;
    // Performance Feedback
    drawSectionHeader("Performance Feedback");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    renderWrappedText(
      reportData.feedback || "No feedback available.",
      margin,
      cursorY,
      pageWidth - 2 * margin
    );

    // Footer
    const timestamp = new Date().toLocaleString();
    checkPageOverflow(10);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, pageWidth / 2, pageHeight - margin, {
      align: "center",
    });

    // Generate PDF Blob and Upload
    const pdfBlob = doc.output("blob");

    await updateTestReportInFirebase2(skills.email, pdfBlob);

    // Save locally
    doc.save("Interview_Report.pdf");
  } catch (error) {
    console.error("Error generating PDF report:", error);
    alert(`Failed to generate report: ${error.message}`);
  }
};



  const viewReport = () => {
    setIsModalOpen(true);
  };

  const closeReportModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url('.\assets\image.png')] bg-cover  text-gray-300 p-6 rounded-lg shadow-xl">
      <h1 className="text-4xl mb-4 text-center font-extrabold font-serif text-gray-900 cursor-pointer">🎉🎉🎉 Congratulations! 🎉🎉🎉 </h1>
      <p className="text-lg mb-6 text-center text-gray-500">
        You have successfully completed the interview. Our team will contact you within 1 or 2 working days...
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          variant="contained"
          color="primary"
          onClick={generatePDFReport}
          className="transition duration-300 transform hover:scale-105 focus:outline-none"
        >
          Download Report
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={viewReport}
          className="transition duration-300 transform hover:scale-105 border-gray-800 text-gray-300 hover:border-indigo-500 hover:text-indigo-500 focus:outline-none"
        >
          View Report
        </Button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={closeReportModal}
        questionsData={questionsData}
        report={report} 
      />
    </div>
  );
};

export default Final;