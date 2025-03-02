const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from public directory
app.use(express.static('public'));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('login', (username) => {
        users.set(socket.id, username);
        console.log(`${username} logged in`);
    });

    socket.on('private_message', (data) => {
        const recipientSocket = Array.from(users.entries())
            .find(([_, name]) => name === data.recipient)?.[0];

        if (recipientSocket) {
            // Forward the complete message including file data
            io.to(recipientSocket).emit('new_message', {
                sender: users.get(socket.id),
                message: data.message,
                file: data.file // This includes {name, type, data}
            });
        } else {
            // Optionally notify sender that recipient wasn't found
            socket.emit('error', { message: 'Recipient not found' });
        }
    });

    socket.on('disconnect', () => {
        users.delete(socket.id);
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});