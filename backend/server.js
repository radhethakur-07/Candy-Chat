const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http'); 
const { Server } = require('socket.io'); 

// Models & Routes
const Message = require('./models/Message'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app); 

// --- 1. Socket.io Setup ---
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*", 
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 5e7 // 50 MB limit for images/files
});

// --- 2. Middleware ---
// CORS को FRONTEND_URL के साथ कॉन्फ़िगर किया ताकि Vercel से बात हो सके
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// --- 3. Health Check Route (UptimeRobot के लिए) ---
app.get('/', (req, res) => {
    res.send("Candy Chat Backend is Running Successfully! 🚀");
});

// --- 4. API Routes ---
app.use('/api/users', userRoutes); 
app.use('/api/auth', authRoutes);

// --- 4b. Debug: Test Brevo Email ---
// Usage: GET /api/test-email?to=youremail@gmail.com
// This lets you check if Brevo is working without going through the signup flow.
app.get('/api/test-email', async (req, res) => {
    const toEmail = req.query.to;
    if (!toEmail) return res.status(400).json({ message: 'Provide ?to=email param' });

    console.log(`🧪 Test email requested to: ${toEmail}`);
    console.log(`🔑 BREVO_API_KEY present: ${!!process.env.BREVO_API_KEY}`);

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'Candy Chat Test', email: 'harikrdbg121@gmail.com' },
                to: [{ email: toEmail }],
                subject: 'Candy Chat — Test Email',
                htmlContent: '<h2>✅ Brevo API is working!</h2><p>Your OTP emails should work fine now.</p>'
            })
        });

        const responseText = await response.text();
        console.log(`📬 Brevo Test Response Status: ${response.status}`);
        console.log(`📬 Brevo Test Response Body: ${responseText}`);

        let parsed;
        try { parsed = JSON.parse(responseText); } catch { parsed = responseText; }

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                brevoStatus: response.status,
                brevoResponse: parsed,
                apiKeySet: !!process.env.BREVO_API_KEY
            });
        }

        return res.status(200).json({
            success: true,
            message: `Test email sent to ${toEmail}! Check your inbox.`,
            brevoStatus: response.status,
            brevoResponse: parsed
        });

    } catch (err) {
        console.error('❌ Test Email Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// --- 5. Message History API ---
app.get('/api/messages/:chatId', async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// --- 6. Socket.io Logic ---
io.on('connection', (socket) => {
    console.log('🔥 A User Connected:', socket.id);

    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message(data);
            await newMessage.save();
            socket.broadcast.emit('receive_message', data);
        } catch (error) { console.log("Socket Send Error:", error); }
    });

    socket.on('delete_message', async (messageId) => {
        try {
            await Message.deleteOne({ id: messageId });
            io.emit('message_deleted', messageId); 
        } catch (error) { console.log("Socket Delete Error:", error); }
    });

    socket.on('typing', (roomId) => {
        socket.broadcast.emit('user_typing', roomId);
    });

    socket.on('stop_typing', (roomId) => {
        socket.broadcast.emit('user_stopped_typing', roomId);
    });

    socket.on('clear_chat', async (chatId) => {
        try {
            await Message.deleteMany({ chatId });
            io.emit('chat_cleared', chatId);
        } catch (error) { console.log("Socket Clear Error:", error); }
    });

    socket.on('disconnect', () => {
        console.log('❌ User Disconnected:', socket.id);
    });
});

// --- 7. Database & Server Start ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
