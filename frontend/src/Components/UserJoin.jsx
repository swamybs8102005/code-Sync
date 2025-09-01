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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-5">
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/40 to-purple-600/40 blur-md opacity-70" aria-hidden="true" />
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-3">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-white text-2xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isCreatingRoom ? 'Create New Room' : 'Join Existing Room'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Start collaborating in real-time with your team
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={handleJoinExisting}
              className={`flex-1 px-4 py-3 rounded-lg cursor-pointer transition duration-200 font-medium border ${
                !isCreatingRoom
                  ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-transparent'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={handleCreateRoom}
              className={`flex-1 px-4 py-3 rounded-lg cursor-pointer transition duration-200 font-medium border ${
                isCreatingRoom
                  ? 'bg-green-600 text-white shadow-lg hover:bg-green-700 border-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-transparent'
              }`}
            >
              Create Room
            </button>
          </div>

          <form onSubmit={handleJoinRoom} className="flex flex-col gap-5">
            <div className="">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Room ID {isCreatingRoom && '(Auto-generated)'}
              </label>
              <div className="relative">
                                <input
                  className="w-full h-12 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="text"
                  placeholder={
                    isCreatingRoom ? 'Room ID will be generated' : 'Enter Room ID'
                  }
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={isCreatingRoom}
                  required={!isCreatingRoom}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                                <input
                  className="w-full h-12 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 px-6 rounded-lg transition duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl ring-1 ring-inset ring-white/10"
            >
              {isCreatingRoom ? 'Create & Join Room' : 'Join Room'}
            </button>
          </form>

          {isCreatingRoom && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-400 text-sm text-center">
                Room ID: <span className="font-mono font-bold">{roomId}</span>
              </p>
              <p className="text-green-600 dark:text-green-500 text-xs text-center mt-1">
                Share this ID with others to invite them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserJoin
