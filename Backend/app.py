import os
import uuid
import json
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import imagetotext
import ask_questions
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'output_results'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure required directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save uploaded file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Generate unique output directory name
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], str(uuid.uuid4()))
        
        # Process image using imagetotext.py
        try:
            asset_id = imagetotext._upload_asset(open(file_path, "rb"), "Input Image")
            
            inputs = {"image": f"{asset_id}", "render_label": False}
            asset_list = f"{asset_id}"
            
            headers = {
                "Content-Type": "application/json",
                "NVCF-INPUT-ASSET-REFERENCES": asset_list,
                "NVCF-FUNCTION-ASSET-IDS": asset_list,
                "Authorization": imagetotext.header_auth,
            }
            
            response = imagetotext.requests.post(imagetotext.nvai_url, headers=headers, json=inputs, verify=False)
            response.raise_for_status()
            
            os.makedirs(output_dir, exist_ok=True)
            with open(f"{output_dir}.zip", "wb") as out:
                out.write(response.content)
            
            with imagetotext.zipfile.ZipFile(f"{output_dir}.zip", "r") as z:
                z.extractall(output_dir)

            # Clean up zip file
            os.remove(f"{output_dir}.zip")
            
            # Get the extracted text and log it
            response_file = [f for f in os.listdir(output_dir) if f.endswith('.response')][0]
            extracted_text = ask_questions.read_extracted_content(os.path.join(output_dir, response_file))
            
            # Log the extracted text
            logger.info(f"Extracted text from image '{filename}':\n{extracted_text}")
            
            return jsonify({
                'success': True,
                'message': 'File processed successfully',
                'output_dir': output_dir
            })

        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        logger.error(f"Error in upload endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        if not data or 'question' not in data or 'output_dir' not in data:
            return jsonify({'error': 'Missing required parameters'}), 400

        question = data['question']
        output_dir = data['output_dir']

        # Find the response file in the output directory
        response_files = [f for f in os.listdir(output_dir) if f.endswith('.response')]
        if not response_files:
            return jsonify({'error': 'No extracted text found'}), 404

        response_file = os.path.join(output_dir, response_files[0])
        content = ask_questions.read_extracted_content(response_file)
        
        # Log the question and content being processed
        logger.info(f"Processing question: {question}")
        logger.info(f"Content being processed:\n{content}")
        
        answer = ask_questions.ask_question(content, question)
        if answer:
            logger.info(f"Generated answer: {answer}")
            return jsonify({'answer': answer})
        else:
            logger.error("Failed to generate answer")
            return jsonify({'error': 'Failed to get answer'}), 500

    except Exception as e:
        logger.error(f"Error in ask endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
