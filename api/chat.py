# Import necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

# Initialize the Flask application
app = Flask(__name__)

# Configure CORS with the environment variable for allowed origins, supporting comma-separated URLs
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Load the OpenAI API key from an environment variable
openai.api_key = os.getenv('OPENAI_API_KEY')

# Get the system message from an environment variable
SYSTEM_MESSAGE = os.getenv('SYSTEM_MESSAGE', 'You are a helpful assistant.')

# Define the route for the chat API
@app.route('/api/chat', methods=['POST'])
def chat():
    # Parse the incoming JSON data
    data = request.json
    messages = data.get('messages', [])

    # Add the system message at the start of the conversation
    system_message = {
        "role": "system",
        "content": SYSTEM_MESSAGE
    }
    messages.insert(0, system_message)

    # Call the OpenAI API with the conversation messages and return the response
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-16k",  # Use GPT-4 model
            messages=messages
        )
        return jsonify(response)
    except openai.error.OpenAIError as e:
        # If there is an API error, return the error message with a 500 status code
        return jsonify({'error': str(e)}), 500

# Run the Flask app if this file is executed as the main program
if __name__ == '__main__':
    app.run()
