import signal
from contextlib import contextmanager
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)

allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

openai.api_key = os.getenv('OPENAI_API_KEY')
SYSTEM_MESSAGE = os.getenv('SYSTEM_MESSAGE', 'You are a helpful assistant.')

# Create a context manager to timeout function execution
@contextmanager
def time_limit(seconds):
    def signal_handler(signum, frame):
        raise TimeoutError("Timed out!")
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])

    system_message = {
        "role": "system",
        "content": SYSTEM_MESSAGE
    }
    messages.insert(0, system_message)

    # Log the received messages including the system message
    print('Received messages:', messages)

    try:
        with time_limit(60):
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=messages
            )
            # Log the OpenAI response
            print('OpenAI response:', response)
            return jsonify(response)
    except TimeoutError:
        print('TimeoutError occurred')  # Log the timeout error
        return jsonify({'error': 'Sorry, it looks like OpenAI took too long. Please try again. If the issue persists, please refresh the page.'}), 504
    except openai.error.OpenAIError as e:
        print('OpenAIError:', str(e))  # Log the OpenAI error
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()
