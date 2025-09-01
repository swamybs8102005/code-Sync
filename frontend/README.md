# Frontend - Real-time Collaborative Code Editor

## Setup

```bash
npm install
```

## Config
- Backend URL (optional): create a `.env` file in `frontend/` and set:
  ```env
  VITE_SOCKET_URL=http://localhost:5000
  ```
  Defaults to `http://localhost:5000` if not set.

## Run
```bash
npm run dev
```

Open the app and share a room link:
- Rooms are set via URL param: `?room=<room-id>`
- Click "New room" and "Copy link" to share.
