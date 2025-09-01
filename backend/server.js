require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Code execution via Judge0 CE
const DEFAULT_JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';
const LANGUAGE_MAP = {
  javascript: 63, // Node.js
  typescript: 74, // TypeScript
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++ (GCC)
};

app.post('/api/execute', async (req, res) => {
  try {
    const { language = 'javascript', code = '', stdin = '' } = req.body || {};
    const language_id = LANGUAGE_MAP[language];
    if (!language_id) {
      return res.status(400).json({ error: 'Unsupported language', language });
    }

    const submitUrl = `${DEFAULT_JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
    const submission = {
      source_code: code,
      language_id,
      stdin,
    };

    const r = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });

    const data = await r.json();
    const { stdout, stderr, compile_output, time, memory, status } = data || {};
    res.json({ stdout, stderr, compile_output, time, memory, status });
  } catch (err) {
    console.error('❌ Code execution error:', err);
    res.status(500).json({ error: 'Execution failed' });
  }
});

const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/realtime-editor';
let dbConnected = false;

// Try to connect to MongoDB, continue gracefully if not available
mongoose
  .connect(process.env.MONGO_URI || DEFAULT_MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    dbConnected = true;
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    dbConnected = false;
    console.error('⚠️ MongoDB not available, using in-memory storage. Error:', err?.message || err);
  });

// In-memory storage fallback
const memoryStore = new Map(); // roomId -> { content, createdAt, updatedAt }

async function loadDocument(roomId) {
  if (dbConnected) {
    let doc = await Document.findOne({ roomId });
    if (!doc) {
      doc = await Document.create({
        roomId,
        content: `// Welcome to room: ${roomId}\n// Start coding together!`,
      });
    }
    return doc.content;
  }
  // Fallback
  if (!memoryStore.has(roomId)) {
    memoryStore.set(roomId, {
      content: `// Welcome to room: ${roomId}\n// Start coding together!`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return memoryStore.get(roomId).content;
}

async function saveDocument(roomId, content) {
  if (dbConnected) {
    await Document.findOneAndUpdate(
      { roomId },
      { content },
      { new: true, upsert: true }
    );
    return;
  }
  // Fallback
  const existing = memoryStore.get(roomId) || { createdAt: new Date() };
  memoryStore.set(roomId, { ...existing, content, updatedAt: new Date() });
}

// Track users per room
const roomUsers = new Map();
const DEFAULT_ROOM_ID = 'default';

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('join', async (roomId = DEFAULT_ROOM_ID) => {
    try {
      // Leave previous room if any
      if (socket.roomId) {
        const prevRoom = roomUsers.get(socket.roomId) || new Set();
        prevRoom.delete(socket.id);
        if (prevRoom.size === 0) {
          roomUsers.delete(socket.roomId);
        } else {
          roomUsers.set(socket.roomId, prevRoom);
          io.to(socket.roomId).emit('user-count', prevRoom.size);
        }
      }

      // Join new room
      socket.join(roomId);
      socket.roomId = roomId;

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);

      // Load or create document (DB or in-memory)
      const content = await loadDocument(roomId);

      // Send document content and user count
      socket.emit('load-document', content || '');
      io.to(roomId).emit('user-count', roomUsers.get(roomId).size);

      console.log(
        `👥 User ${socket.id} joined room: ${roomId} (${roomUsers.get(roomId).size} users)`
      );
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', 'Failed to load document');
    }
  });

  socket.on('send-changes', ({ roomId = DEFAULT_ROOM_ID, delta }) => {
    if (socket.roomId === roomId) {
      socket.to(roomId).emit('receive-changes', delta);
      console.log(`📝 Changes sent in room ${roomId} by ${socket.id}`);
    }
  });

  socket.on('save-document', async ({ roomId = DEFAULT_ROOM_ID, content }) => {
    try {
      if (socket.roomId === roomId) {
        await saveDocument(roomId, content);
        console.log(`💾 Document saved for room: ${roomId}`);
      }
    } catch (error) {
      console.error('❌ Error saving document:', error);
      socket.emit('error', 'Failed to save document');
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);

    if (socket.roomId) {
      const room = roomUsers.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          roomUsers.delete(socket.roomId);
          console.log(`🏚️ Room ${socket.roomId} is now empty`);
        } else {
          roomUsers.set(socket.roomId, room);
          io.to(socket.roomId).emit('user-count', room.size);
          console.log(`👥 Room ${socket.roomId} now has ${room.size} users`);
        }
      }
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
