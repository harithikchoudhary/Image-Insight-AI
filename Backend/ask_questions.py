import os
import json
import certifi
import traceback
import logging
from openai import OpenAI

# Configure logging to show only errors
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Set SSL certificate environment variables
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()

# Initialize NVIDIA AI client
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

def read_extracted_content(response_file):
    """Read the extracted text content from the response file"""
    with open(response_file, 'r') as f:
        data = json.load(f)
        # Extract text from metadata and sort by y-coordinate for natural reading order
        text_items = [(item['label'], item['polygon']['y1']) for item in data['metadata']]
        text_items.sort(key=lambda x: x[1])  # Sort by y-coordinate
        return ' '.join(item[0] for item in text_items)

def ask_question(content, question):
    """Ask a question about the content using NVIDIA AI"""
    try:
        # Format prompt with context and question
        prompt = f"Context: {content}\n\nQuestion: {question}\n\nAnswer:"
        
        # Make API call to NVIDIA's model
        completion = client.chat.completions.create(
            model="nvidia/llama-3.3-nemotron-super-49b-v1",
            messages=[
                {
                    "role": "system", 
                    "content": """You are a helpful assistant that answers questions about bills and receipts.
                    Rules:
                    1. Always answer in a complete, grammatically correct sentence
                    2. Keep answers brief and concise
                    3. If information is not found, respond with one of these phrases:
                       - "This detail is not visible in the bill due to image clarity issues."
                       - "This information is not present in the provided bill."
                       - "Unable to find this detail in the current bill."
                    4. For numerical values, include the currency symbol if available"""
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.6,
            top_p=0.95,
            max_tokens=100,
            frequency_penalty=0,
            presence_penalty=0,
            stream=False
        )
        
        answer = completion.choices[0].message.content.strip()
        return answer
    except Exception as e:
        logger.error(f"Error in ask_question: {str(e)}")
        logger.error("Traceback: %s", traceback.format_exc())
        return None

def main():
    try:
        # Get the most recent response file from output_results directory
        output_dir = 'output_results'
        response_files = [f for f in os.listdir(output_dir) if f.endswith('.response')]
        if not response_files:
            print("No extracted text found. Please run the image extraction first.")
            return
        
        latest_response = os.path.join(output_dir, response_files[0])
        content = read_extracted_content(latest_response)
        
        while True:
            # Get question from user
            print("\nEnter your question about the bill (or 'quit' to exit):")
            question = input("> ").strip()
            
            if question.lower() == 'quit':
                break
                
            if not question:
                print("Please enter a valid question.")
                continue
            
            print("\nProcessing...")
            answer = ask_question(content, question)
            
            if answer:
                print("\nAnswer:")
                print("-" * 50)
                print(answer)
                print("-" * 50)
            else:
                print("Sorry, there was an error processing your question. Please try again.")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()