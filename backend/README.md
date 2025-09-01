# Backend - Real-time Collaborative Code Editor

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the backend directory with the following content:
   ```env
   MONGO_URI=mongodb://localhost:27017/realtime-editor
   PORT=5000
   ```
3. Run in dev mode (auto-restart):
   ```bash
   npm run dev
   ```
   Or run normally:
   ```bash
   npm start
   ```

## API
- `GET /health` → `{ status: 'ok' }`

## Realtime events
- `join(roomId)`
- `load-document(content)` (server→client)
- `send-changes({ roomId, delta })`
- `receive-changes(delta)` (server→client)
- `save-document({ roomId, content })`
