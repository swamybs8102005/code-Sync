import React, { useState } from 'react'
import UserJoin from './Components/UserJoin'
import Sidebar from './Components/Sidebar'
import MonacoEditor from './Components/Monaco'
import { EditorProvider, useEditor } from './context/EditorContext'

function AppContent() {
  const [isUserJoined, setIsUserJoined] = useState(false)
  const [userData, setUserData] = useState(null)
  const { joinRoom } = useEditor()

  const handleUserJoin = (userInfo) => {
    setUserData(userInfo)
    setIsUserJoined(true)
    joinRoom(userInfo.roomId, userInfo.username) // Join the room
  }

  const handleUserLeave = () => {
    setUserData(null)
    setIsUserJoined(false)
  }

  return (
    <>
      {!isUserJoined ? (
        <UserJoin onJoin={handleUserJoin} />
      ) : (
        <div className="h-screen w-screen flex flex-row bg-slate-900 overflow-hidden ">
          <Sidebar userData={userData} onLeave={handleUserLeave} />
          <MonacoEditor userData={userData} />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  )
}

export default App
