// Sample data for chat messages
const chatData = [
    {
        name: 'Team Alpha',
        type: 'team',
        lastMessage: 'New case briefing at 2 PM',
        time: '10:30 AM',
        unread: 2
    },
    {
        name: 'Det. Sarah Johnson',
        type: 'direct',
        lastMessage: 'Updates on Case #2024-001',
        time: '09:45 AM',
        unread: 0
    }
    // Add more chat data as needed
];

// Initialize chat list
function initializeChatList() {
    const chatList = document.querySelector('.chat-list');
    chatData.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="chat-avatar">
                ${chat.type === 'team' ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
            </div>
            <div class="chat-details">
                <h4>${chat.name}</h4>
                <p>${chat.lastMessage}</p>
            </div>
            ${chat.unread > 0 ? `<span class="unread-badge">${chat.unread}</span>` : ''}
        `;
        chatList.appendChild(chatItem);
    });
}

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.tab-btn.active').classList.remove('active');
        btn.classList.add('active');
        // Add filter logic here
    });
});

// Handle message sending
const chatInput = document.querySelector('.chat-input input');
const sendBtn = document.querySelector('.send-btn');

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        const messagesContainer = document.querySelector('.messages-container');
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        chatInput.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize the chat interface
document.addEventListener('DOMContentLoaded', () => {
    initializeChatList();
});

// Add some sample messages
const sampleMessages = [
    { text: "Team briefing scheduled for 2 PM today", type: "received" },
    { text: "I'll prepare the case files", type: "sent" },
    { text: "Don't forget to include the new evidence", type: "received" }
];

function addSampleMessages() {
    const messagesContainer = document.querySelector('.messages-container');
    sampleMessages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.type}`;
        messageElement.textContent = msg.text;
        messagesContainer.appendChild(messageElement);
    });
}

addSampleMessages(); 