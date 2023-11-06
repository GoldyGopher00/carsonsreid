
import os
from http.server import BaseHTTPRequestHandler
from json import dumps, loads
import requests

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        # Parse the incoming conversation messages from the client's request
        content_length = int(self.headers['Content-Length'])
        post_data = loads(self.rfile.read(content_length))

        # Prepare the data for OpenAI API request
        openai_request_payload = {
            "model": "gpt-3.5-turbo",  # specify the model you're using
            "messages": post_data['messages']  # conversation history from the client
        }

        # Add your own OpenAI API Key here
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {os.getenv("OPENAI_API_KEY")}'
        }

        # Make the POST request to OpenAI API
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=openai_request_payload
        )

        # Send back the OpenAI API response to the client
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(dumps(response.json()).encode())

# Note: Remember to handle exceptions and errors appropriately in production code.
