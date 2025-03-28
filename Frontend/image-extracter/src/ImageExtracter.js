import React, { useState } from "react";
import { Upload, FileImage, SendHorizontal, Loader2 } from "lucide-react";

const ImageInsightApp = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [currentOutputDir, setCurrentOutputDir] = useState(null);

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setIsUploading(true);
      setExtractedText("");

      try {
        // Simulated upload process
        // Replace with actual upload logic
        const response = await simulateUpload(formData);
        setExtractedText(response.extracted_text);
        setCurrentOutputDir(response.output_dir);
        setIsUploading(false);
      } catch (error) {
        console.error("Upload failed", error);
        setIsUploading(false);
      }
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();

    if (!currentOutputDir) {
      alert("Please upload an image first");
      return;
    }

    setIsProcessingQuestion(true);
    setAnswer("");

    try {
      // Simulated question processing
      // Replace with actual question processing logic
      const response = await simulateQuestionProcess(
        question,
        currentOutputDir
      );
      setAnswer(response.answer);
      setIsProcessingQuestion(false);
    } catch (error) {
      console.error("Question processing failed", error);
      setIsProcessingQuestion(false);
    }
  };

  // Simulated backend functions (replace with actual API calls)
  const simulateUpload = (formData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          extracted_text: "Sample extracted text from the uploaded image...",
          output_dir: "sample_output_directory",
        });
      }, 1500);
    });
  };

  const simulateQuestionProcess = (question, outputDir) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          answer: `Answer to "${question}" based on the image content...`,
        });
      }, 1500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-6 transform transition-all hover:scale-105 duration-300">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-teal-700 mb-2">
            Image Insight
          </h1>
          <p className="text-gray-600">Extract Text & Get Answers</p>
        </div>

        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
          <h2 className="text-teal-700 font-semibold mb-4 flex items-center">
            <Upload className="mr-2" /> Upload Image
          </h2>

          <div
            className={`border-2 border-dashed border-teal-600 rounded-xl p-6 text-center cursor-pointer 
              hover:bg-teal-100 transition-colors group ${
                file ? "border-green-500" : ""
              }`}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <FileImage
              className="mx-auto mb-4 text-teal-600 group-hover:text-teal-700"
              size={48}
            />
            <p className="text-gray-600">
              {file
                ? `Selected: ${file.name}`
                : "Drag & drop or click to select image"}
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center mt-4 text-teal-700">
              <Loader2 className="mr-2 animate-spin" />
              Processing image...
            </div>
          )}

          {extractedText && (
            <div className="mt-4 p-3 bg-white border border-teal-100 rounded-xl max-h-40 overflow-y-auto">
              <h3 className="font-semibold text-teal-700 mb-2">
                Extracted Text
              </h3>
              <p className="text-gray-700">{extractedText}</p>
            </div>
          )}
        </div>

        {extractedText && (
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
            <h2 className="text-teal-700 font-semibold mb-4 flex items-center">
              <SendHorizontal className="mr-2" /> Ask a Question
            </h2>

            <form onSubmit={handleQuestionSubmit} className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know?"
                className="flex-grow p-3 border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
              <button
                type="submit"
                className="bg-teal-700 text-white p-3 rounded-xl hover:bg-teal-800 transition-colors flex items-center"
              >
                <SendHorizontal />
              </button>
            </form>

            {isProcessingQuestion && (
              <div className="flex items-center justify-center mt-4 text-teal-700">
                <Loader2 className="mr-2 animate-spin" />
                Generating answer...
              </div>
            )}

            {answer && (
              <div className="mt-4 p-3 bg-white border border-teal-100 rounded-xl max-h-40 overflow-y-auto">
                <h3 className="font-semibold text-teal-700 mb-2">Answer</h3>
                <p className="text-gray-700">{answer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageInsightApp;
