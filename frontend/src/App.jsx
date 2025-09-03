import React, { useState } from 'react'
import UserJoin from './Components/UserJoin'
import WorkspaceShell from './Components/WorkspaceShell'
import { EditorProvider, useEditor } from './context/EditorContext'

function AppContent() {
  const [isUserJoined, setIsUserJoined] = useState(false)
  const [userData, setUserData] = useState(null)
  const { joinRoom } = useEditor()
  const [showSidebar, setShowSidebar] = useState(true)

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
        <WorkspaceShell userData={userData} onLeave={handleUserLeave} />
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
