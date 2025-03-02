// public/main.js
let socket;
let token;

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
  const socket = io(); // Connect to the server

  const loginForm = document.getElementById('login-form');
  const chatContainer = document.getElementById('chat-container');
  const loginContainer = document.getElementById('login-container');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const messagesDiv = document.getElementById('messages');
  const logoutBtn = document.getElementById('logout-btn');
  const loginError = document.getElementById('login-error');
  const loggedInUser = document.getElementById('logged-in-user');

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    socket.emit('login', username); // Emit login event
    loggedInUser.textContent = `Logged in as: ${username}`;
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'block';
  });

  messageForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const message = messageInput.value;
    const recipient = prompt("Enter the recipient's username:");
    if (message && recipient) {
      socket.emit('private_message', { recipient, message });
      // Display the message you just sent in the chat window
      const messageElement = document.createElement('div');
      messageElement.textContent = `Me: ${message}`;
      messagesDiv.appendChild(messageElement);
      messageInput.value = '';
    }
  });

  socket.on('new_message', function(data) {
    const { sender, message } = data;
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageElement);
  });

  logoutBtn.addEventListener('click', function() {
    socket.disconnect();
    loginContainer.style.display = 'block';
    chatContainer.style.display = 'none';
    messagesDiv.innerHTML = ''; // Clear messages
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
    loginContainer.style.display = 'block';
    chatContainer.style.display = 'none';
    messagesDiv.innerHTML = ''; // Clear messages
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    loginError.textContent = 'Connection error. Please try again later.';
  });
});

// Initialize Socket.IO connection with JWT in authentication
function initSocket() {
  socket = io({
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('message', (data) => {
    const messagesDiv = document.getElementById('messages');
    const msgEl = document.createElement('div');
    msgEl.innerText = `${data.user}: ${data.msg}`;
    messagesDiv.appendChild(msgEl);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });

  socket.on('new_message', function(data) {
    const { sender, message } = data;
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    document.getElementById('messages').appendChild(messageElement);
  });
}
