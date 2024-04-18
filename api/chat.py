import os
import json
import signal
from contextlib import contextmanager
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Environment variables
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
openai.api_key = os.getenv('OPENAI_API_KEY')
SYSTEM_MESSAGE = os.getenv('SYSTEM_MESSAGE', 'You are a helpful assistant.')

# Initialize Firebase
firebase_cred = json.loads(os.environ['FIREBASE_CREDENTIALS'].replace('\\n', '\n'))
cred = credentials.Certificate(firebase_cred)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Context manager for handling timeout
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

# API route for handling chat
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])

    system_message = {
        "role": "system",
        "content": SYSTEM_MESSAGE
    }
    messages.insert(0, system_message)

    try:
        with time_limit(60):
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=messages
            )

            # Save conversation to Firestore
            chat_ref = db.collection('conversations').document()
            chat_ref.set({
                'user_messages': messages,
                'ai_response': response,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            return jsonify(response)
    except TimeoutError:
        return jsonify({'error': 'Timeout, please try again.'}), 504
    except openai.error.OpenAIError as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()
