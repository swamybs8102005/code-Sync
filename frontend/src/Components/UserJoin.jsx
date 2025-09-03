import React, { useState } from 'react'

const UserJoin = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('')
  const [username, setUsername] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const generateRoomId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID()
    return (
      'room-' +
      Math.random().toString(36).slice(2, 10) +
      '-' +
      Date.now().toString(36)
    )
  }

  const handleJoinRoom = (e) => {
    e.preventDefault()
    if (!username.trim()) return

    const finalRoomId = roomId.trim() || 'default'
    onJoin({
      username: username.trim(),
      roomId: finalRoomId,
      isCreator: !roomId.trim(),
    })
  }

  const handleCreateRoom = () => {
    setIsCreatingRoom(true)
    setRoomId(generateRoomId())
  }

  const handleJoinExisting = () => {
    setIsCreatingRoom(false)
    setRoomId('')
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-0"
      style={{
        backgroundImage:
          "radial-gradient(1000px 600px at -10% -10%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(800px 600px at 110% 10%, rgba(147,51,234,0.35), transparent 60%), radial-gradient(900px 600px at 50% 120%, rgba(16,185,129,0.25), transparent 60%), url('data:image/svg+xml;utf8, %3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'1920\\' height=\\'1080\\' viewBox=\\'0 0 1920 1080\\'%3E%3Cdefs%3E%3Cpattern id=\\'grid\\' width=\\'40\\' height=\\'40\\' patternUnits=\\'userSpaceOnUse\\'%3E%3Cpath d=\\'M 40 0 L 0 0 0 40\\' fill=\\'none\\' stroke=\\'%236b7280\\' stroke-opacity=\\'0.15\\' stroke-width=\\'1\\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'url(%23grid)\\'/%3E%3C/svg%3E')",
        backgroundColor: '#020617',
        backgroundBlendMode: 'screen, screen, screen, normal',
      }}
    >
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/40 via-fuchsia-500/30 to-emerald-500/30 blur-2xl opacity-70" aria-hidden="true" />
        <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_20px_60px_-10px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs font-mono text-slate-400">collab://join</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">UTF-8 • LF • JavaScript</div>
          </div>

          <div className="p-10">
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{isCreatingRoom ? 'Create New Room' : 'Join Existing Room'}</h1>
              <p className="text-slate-300 mt-2 font-mono">// Start collaborating in real-time with your team</p>
            </div>

            <div className="flex w-full items-center gap-3 mb-8 rounded-xl border border-slate-700/80 bg-slate-900/70 p-1 shadow-inner shadow-slate-950/60" role="tablist" aria-label="Join or Create Room">
              <button
                onClick={handleJoinExisting}
                role="tab"
                aria-selected={!isCreatingRoom}
                className={`flex-1 text-center px-5 py-3 rounded-lg cursor-pointer text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${!isCreatingRoom ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-white/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
              >
                Join Room
              </button>
              <button
                onClick={handleCreateRoom}
                role="tab"
                aria-selected={isCreatingRoom}
                className={`flex-1 text-center px-5 py-3 rounded-lg cursor-pointer text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${isCreatingRoom ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-600/30 ring-1 ring-white/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
              >
                Create Room
              </button>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col gap-6">
            <div>
              <label className="block text-slate-200 text-sm font-semibold mb-2">Room ID {isCreatingRoom && '(Auto-generated)'}</label>
              <input
                className="w-full h-12 px-4 border border-slate-700/80 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed shadow-inner shadow-slate-950/80"
                type="text"
                placeholder={isCreatingRoom ? 'Room ID will be generated' : 'Enter Room ID'}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={isCreatingRoom}
                required={!isCreatingRoom}
              />
            </div>

            <div>
              <label className="block text-slate-200 text-sm font-semibold mb-2">Username</label>
              <input
                className="w-full h-12 px-4 border border-slate-700/80 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all font-mono shadow-inner shadow-slate-950/80"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-xl cursor-pointer font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)]"
            >
              {isCreatingRoom ? 'Create & Join Room' : 'Join Room'}
            </button>
            </form>

          {isCreatingRoom && (
            <div className="mt-8 p-4 rounded-xl border border-emerald-500/30 bg-emerald-600/10">
              <p className="text-emerald-300 text-sm text-center font-mono">
                Room ID: <span className="font-mono font-bold">{roomId}</span>
              </p>
              <p className="text-emerald-400/80 text-xs text-center mt-1">Share this ID with others to invite them</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserJoin
