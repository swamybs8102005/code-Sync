# Real-Time Collaborative Code Editor

A modern, real-time collaborative code editor built with React, Monaco Editor, and Socket.IO.

## Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Live Cursor Tracking**: See where other users are typing
- **Chat System**: Built-in chat for team communication
- **Version History**: Track and restore previous versions of your code
- **Multiple Languages**: Support for JavaScript, TypeScript, Python, Java, and C++
- **Code Execution**: Run code directly in the browser using Judge0 CE
- **File Management**: Save and load files from your local system

## How Collaboration Works

### 1. Real-Time Code Synchronization
When a user types in the editor:
1. The change is computed as a "delta" (difference between old and new content)
2. The delta is sent to the server via WebSocket
3. The server broadcasts the change to all other users in the same room
4. Other users' editors automatically apply the changes in real-time

### 2. Delta-Based Updates
Instead of sending the entire file content, the system uses delta objects:
```javascript
{
  start: 10,        // Position where change starts
  end: 15,          // Position where change ends  
  text: "new code"  // New text to insert
}
```

### 3. Conflict Prevention
- Local changes are marked with `isRemoteChangeRef` to prevent infinite loops
- Delta validation ensures only valid changes are processed
- The editor automatically syncs remote content without triggering local change events

### 4. Visual Feedback
- **Gray dot**: Ready to sync
- **Yellow dot (pulsing)**: Currently syncing changes
- **Green dot**: Changes successfully synced

## Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB (optional, falls back to in-memory storage)

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm start
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Environment Variables**
Create `.env` files in both directories:
```bash
# Backend .env
PORT=5000
MONGO_URI=mongodb://localhost:27017/realtime-editor
JUDGE0_URL=https://ce.judge0.com

# Frontend .env
VITE_SOCKET_URL=http://localhost:5000
```

### Usage

1. Open the editor in multiple browser tabs/windows
2. Join the same room (or create a new one)
3. Start coding - changes will appear in real-time across all sessions
4. Use the chat panel to communicate with your team
5. Check version history to restore previous code versions

## Architecture

```
Frontend (React + Monaco) ←→ WebSocket ←→ Backend (Node.js + Socket.IO)
                                    ↓
                              MongoDB (optional)
```

## Troubleshooting

### Changes Not Appearing
- Check that both users are in the same room
- Verify WebSocket connection status
- Look for console errors in browser dev tools
- Ensure the backend server is running

### Performance Issues
- Large files may cause delays in synchronization
- Consider breaking large files into smaller modules
- Monitor network latency between users

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.

