import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import './App.css';
import backgroundImage from './assets/CarsonMaddox.jpg';
import axios from 'axios';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// The main App component
function App() {
  // State hooks for various aspects of the app
  const [messages, setMessages] = useState([]); // Stores the conversation messages
  const [input, setInput] = useState(''); // Stores the current value of the input field
  const [isLoading, setIsLoading] = useState(false); // Indicates if the app is in a loading state
  const [sessionId, setSessionId] = useState(''); // Stores the session ID for the user

  // Refs for managing UI effects and behaviors
  const typingRef = useRef(null); // For managing the typing effect interval
  const messagesEndRef = useRef(null); // For scrolling to the bottom of the message list
  const messagesContainerRef = useRef(null); // Ref to the container of messages for scrolling behavior

  // Text to show when simulating the typing effect
  const loadingMessage = "CarsonGPT is thinking...";

  // Function to parse markdown text and sanitize it for safe HTML rendering
  const parseMarkdown = (text) => {
    const rawMarkup = marked(text, { breaks: true });
    return DOMPurify.sanitize(rawMarkup);
  };

  // Handler for input field changes to update the state
  const handleInput = (e) => {
    setInput(e.target.value);
    // Adjust the height of the input field based on its content
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`;
  };

// Function to send the user's message to the server and handle the response
const sendMessage = async () => {
  if (input.trim() && !isLoading) {
    // Constructing the user message object
    const userMessage = {
      role: 'user',
      content: input,
      name: 'You'
    };
    // Adding the user message to the conversation
    setMessages(messages => [...messages, userMessage]);
    setInput(''); // Clear the input field
    setIsLoading(true); // Set loading state
    startTypingEffect(); // Start the typing effect

    // Prepare the messages for the API call
    const apiMessages = messages
      .filter(m => !m.isLoading)
      .map(({ role, content }) => ({ role, content }));

    // Add the new message to the message list for the API call
    apiMessages.push({ role: 'user', content: input });

    try {
      // Make the POST request to the server with a timeout of 60 seconds
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        messages: apiMessages,
        sessionId: sessionId
      }, { timeout: 60000 });

      // If there's a typing effect ongoing, clear it
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
      // Remove the loading message from the conversation
      setMessages(messages => messages.filter(m => !m.isLoading));

      // Process the response from the server
      if (response.data) {
        // Construct the bot message object
        const botMessage = {
          content: parseMarkdown(response.data.choices[0].message.content),
          role: 'system',
          name: 'Carson Reid',
          html: true // Indicates the message contains HTML and should be rendered as such
        };
        // Add the bot message to the conversation
        setMessages(messages => [...messages, botMessage]);
      }
    } catch (error) {
      // Remove the loading message from the conversation
      setMessages(messages => messages.filter(m => !m.isLoading));
      
      // Check if the error was a timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Update the messages state with the timeout message
        setMessages(messages => [
          ...messages,
          {
            role: 'system',
            name: 'CarsonGPT',
            content: 'Sorry, it looks like we have worked my nueral network a bit too hard, please try again. If the issue persists, do me a solid and refresh the page.',
            html: false
          }
        ]);
      } else {
        // Handle other types of errors
        console.error('Error:', error);
        alert("Sorry, it looks like we have worked my nueral network a bit too hard, please try again. If the issue persists, do me a solid and refresh the page.");
      }
    } finally {
      setIsLoading(false); // End the loading state
    }
  }
};

  // Function to simulate the typing effect of the bot
  const startTypingEffect = () => {
    let index = 0; // Start of the typing effect
    let pauseTyping = false; // Flag to pause the typing effect

    const type = () => {
      // If we haven't finished typing the loading message
      if (index < loadingMessage.length) {
        // Add the loading message up to the current index
        setMessages(prevMessages => [
          ...prevMessages.filter(m => !m.isLoading),
          {
            content: loadingMessage.substring(0, index + 1),
            role: 'bot',
            name: 'CarsonGPT',
            isLoading: true // Flag this message as loading
          }
        ]);
        index++; // Move to the next character
      } else {
        // Once the loading message is complete, pause typing
        if (!pauseTyping) {
          pauseTyping = true;
          setTimeout(() => {
            pauseTyping = false;
            index = 0;
          }, 1000); // Pause for a second before restarting the typing effect
        }
      }
    };

    // Clear any existing typing interval
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }
    // Start a new typing interval
    typingRef.current = setInterval(type, 75);
  };

  // useEffect hook to clear the typing interval when the component unmounts or loading is false
  useEffect(() => {
    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
    };
  }, []);

  // useEffect hook to manage session ID state
  useEffect(() => {
    let savedSessionId = localStorage.getItem('sessionId');
    if (!savedSessionId) {
      savedSessionId = generateNewSessionId();
      localStorage.setItem('sessionId', savedSessionId);
    }
    setSessionId(savedSessionId);
  }, []);

  // Function to generate a new, unique session ID
  function generateNewSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Function to scroll to the bottom of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useLayoutEffect hook to handle scrolling to the bottom when new messages arrive
  useLayoutEffect(() => {
    // Check if we should scroll based on the current scroll position
    const shouldScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = messagesContainerRef.current;
      const tolerance = 5;
      return scrollTop + clientHeight + tolerance >= scrollHeight;
    };

    if (shouldScroll()) {
      scrollToBottom();
    }
  }, [messages]);

  // JSX for rendering the component
  return (
    <div className="App">
      <div className="portfolio">
        {/* Embedding the portfolio iframe */}
        <iframe
          src="https://carsonsreid.carrd.co/"
          title="Carson's Portfolio"
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency="true"
          allowFullScreen
        ></iframe>
      </div>
      <div className="chat-interface">
        {/* Message container with dynamic background */}
        <div className="messages" ref={messagesContainerRef} style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        {/* Mapping over the messages and rendering them */}
        {messages.slice().reverse().map((m, index) => (
          <div key={index} className={`message ${m.role} ${m.isLoading ? 'loading' : ''}`}>
            <div className="message-name">{m.name}</div>
            {/* Rendering message as HTML if it contains markdown, otherwise just text */}
            {m.html ? (
              <div className="message-text" dangerouslySetInnerHTML={{ __html: m.content }} />
            ) : (
              <div className="message-text">{m.content}</div>
            )}
          </div>
        ))}
        {/* Invisible div to help with auto-scrolling */}
        <div ref={messagesEndRef} />
        </div>
        {/* Separator line */}
        <div className="line"></div>
        {/* Text input for sending messages */}
        <textarea
          className="input"
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            // Sending message on Enter key press, ignoring if Shift is also pressed
            if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Hi, I'm CarsonGPT. Interview me and I'll respond just like the real Carson."
        />
        {/* Button to send messages */}
        <button onClick={sendMessage} disabled={isLoading} className={isLoading ? 'button-disabled' : ''}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
