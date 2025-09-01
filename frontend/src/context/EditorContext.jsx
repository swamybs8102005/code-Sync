import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

const EditorContext = createContext()

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

export const EditorProvider = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [currentContent, setCurrentContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const socketRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('Connected to server')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('Disconnected from server')
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinRoom = (roomId) => {
    if (socketRef.current && roomId) {
      setIsLoading(true)
      socketRef.current.emit('join', roomId)
      
      socketRef.current.on('load-document', (initial) => {
        setCurrentContent(initial || '')
        setIsLoading(false)
      })

      socketRef.current.on('receive-changes', (delta) => {
        setCurrentContent((prev) => {
          const start = prev.slice(0, delta.start)
          const end = prev.slice(delta.end)
          return start + delta.text + end
        })
      })

      socketRef.current.on('user-count', (count) => {
        // Update user count if needed
      })
    }
  }

  const sendChanges = (roomId, delta) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('send-changes', { roomId, delta })
    }
  }

  const saveDocument = (roomId, content) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('save-document', { roomId, content })
    }
  }

  const updateContent = (newContent) => {
    setCurrentContent(newContent)
  }

  const debouncedSave = (roomId, content) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(roomId, content)
    }, 1000)
  }

  const value = {
    connected,
    users,
    currentContent,
    isLoading,
    joinRoom,
    sendChanges,
    saveDocument,
    updateContent,
    debouncedSave
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
