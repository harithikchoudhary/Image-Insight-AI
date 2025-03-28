import React, { useState } from "react";
import {
  Upload,
  FileImage,
  SendHorizontal,
  Loader2,
  CheckCircle,
} from "lucide-react";

const ImageInsightApp = () => {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [currentOutputDir, setCurrentOutputDir] = useState(null);
  const [isExtracted, setIsExtracted] = useState(false);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setIsExtracted(false);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setCurrentOutputDir(data.output_dir);
      setIsUploading(false);
      setIsExtracted(true);
    } catch (error) {
      console.error("Upload failed", error);
      setIsUploading(false);
      alert("Failed to upload image. Please try again.");
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
      const response = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          output_dir: currentOutputDir,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process question");
      }

      const data = await response.json();
      setAnswer(data.answer);
      setIsProcessingQuestion(false);
    } catch (error) {
      console.error("Question processing failed", error);
      setIsProcessingQuestion(false);
      alert("Failed to process question. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Image Insight
          </h1>
          <p className="text-gray-600 text-lg">
            Ask Questions About Your Image
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
          <h2 className="text-xl font-semibold text-indigo-700 mb-6 flex items-center">
            <Upload className="mr-3" size={24} />
            Upload Image
          </h2>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${
                file
                  ? "border-green-500 bg-green-50"
                  : "border-indigo-300 hover:border-indigo-400"
              }`}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileImage
              className={`mx-auto mb-4 ${
                file ? "text-green-500" : "text-indigo-500"
              }`}
              size={56}
            />
            <p
              className={`text-lg ${file ? "text-green-700" : "text-gray-600"}`}
            >
              {file
                ? `Selected: ${file.name}`
                : "Drag & drop or click to select image"}
            </p>
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || isUploading || isExtracted}
            className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center text-lg font-medium transition-all duration-300
              ${
                !file || isUploading || isExtracted
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
              } text-white`}
          >
            <Upload className="mr-3" size={24} />
            {isUploading ? "Processing..." : "Upload and Extract Text"}
          </button>

          {isUploading && (
            <div className="flex items-center justify-center mt-6 text-indigo-700">
              <Loader2 className="mr-3 animate-spin" size={24} />
              <span className="text-lg">Processing image...</span>
            </div>
          )}

          {isExtracted && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center text-green-700 shadow-sm">
              <CheckCircle className="mr-3" size={24} />
              <span className="text-lg font-medium">
                Text extracted successfully!
              </span>
            </div>
          )}
        </div>

        {isExtracted && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-700 mb-6 flex items-center">
              <SendHorizontal className="mr-3" size={24} />
              Ask a Question
            </h2>

            <form onSubmit={handleQuestionSubmit} className="flex space-x-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know?"
                className="flex-grow p-4 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg shadow-sm"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl flex items-center shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              >
                <SendHorizontal size={24} />
              </button>
            </form>

            {isProcessingQuestion && (
              <div className="flex items-center justify-center mt-6 text-indigo-700">
                <Loader2 className="mr-3 animate-spin" size={24} />
                <span className="text-lg">Generating answer...</span>
              </div>
            )}

            {answer && (
              <div className="mt-6 p-6 bg-white border border-indigo-100 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-indigo-700 mb-3">
                  Answer
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {answer}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageInsightApp;
