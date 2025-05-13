const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const db = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');
app.use(express.json());
app.use(cors(corsOptions));

const io = new Server(server, {
    cors: {
        origin: "https://f4ris5.github.io", // set this to the frontend port
        methods: ["GET", "POST"]
    }
});

const corsOptions = {
    origin: 'https://f4ris5.github.io', // this one too, set to frontend port
    optionsSuccessStatus: 200
};

// socket.IO logic
io.on('connection', (socket) => {
    console.log('New socket connection');

    // join a room based on userID
    socket.on('join', (userId) => {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`User ${userId} joined room ${roomName}`);
    });

    // notifies the receiver that the sender is typing
    socket.on('typing', ({ senderId, receiverId }) => { 
        const receiverRoom = `user_${receiverId}`;
        io.to(receiverRoom).emit('typing', { senderId });
    });
    
    // message event handler
    socket.on('send_message', async ({ senderId, receiverId, message }) => {
        try {
            // save to database
            await db.query(
                'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)',
                [senderId, receiverId, message]
            );

            const payload = {
                message,
                senderId
            };

            // send to sender and receiver rooms
            io.to(`user_${senderId}`).emit('receive_message', payload);
            io.to(`user_${receiverId}`).emit('receive_message', payload);

        } catch (err) {
            console.error('DB error:', err);
        }
    });
});

// middleware to parse JSON
app.get('/messages/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    // validates user
    try {
        const result = await db.query(
            `SELECT * FROM messages 
             WHERE sender_id = $1 OR receiver_id = $1 
             ORDER BY timestamp ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch messages');
    }
});

// fetches all messages between two users
app.get('/messages/conversation/:userId/:otherUserId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const otherUserId = parseInt(req.params.otherUserId);

    try {
        const result = await db.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2)
             OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY timestamp ASC`,
            [userId, otherUserId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch conversation');
    }
});

// adds a new user to the database
app.post('/addname', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).send('Username and password are required.');
        }

        // password hashing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await db.query(
            'INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING id, username, created_at',
            [name, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// login handler
app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [name]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).send('Invalid username or password.');
        }

        // compare password with stored hash
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).send('Invalid username or password.');
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
