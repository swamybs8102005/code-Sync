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
  const [username, setUsername] = useState('')
  const [externalFileHandle, setExternalFileHandle] = useState(null)
  const [externalFilePath, setExternalFilePath] = useState('')
  const socketRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinRoom = (roomId, username) => {
    if (socketRef.current && roomId) {
      setIsLoading(true)
      setUsername(username || '')

      const s = socketRef.current
      // prevent duplicate listeners and register before join
      s.off('load-document')
      s.off('receive-changes')
      s.off('user-count')
      s.off('users')

      s.on('load-document', (initial) => {
        setCurrentContent(initial || '')
        setIsLoading(false)
      })

      s.on('receive-changes', (delta) => {
        setCurrentContent((prev) => {
          const start = prev.slice(0, delta.start)
          const end = prev.slice(delta.end)
          return start + delta.text + end
        })
      })

      s.on('user-count', () => {})

      s.on('users', (list) => {
        setUsers(Array.isArray(list) ? list : [])
      })

      s.emit('join', { roomId, username })
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

  const subscribeToRemoteCursor = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('cursor-update', handler);
    return () => socketRef.current?.off('cursor-update', handler);
  };

  const sendCursor = (roomId, offset) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('cursor-update', { roomId, offset });
    }
  };

  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const handler = (msg) => setMessages((m) => [...m, msg]);
    s.off('chat-message', handler);
    s.on('chat-message', handler);
    return () => s.off('chat-message', handler);
  }, [connected]);

  const sendChat = (roomId, username, message) => {
    if (socketRef.current && connected && message) {
      socketRef.current.emit('chat-message', { roomId, username, message, timestamp: new Date().toISOString() });
    }
  };

  const setExternalFile = (handle, path) => {
    setExternalFileHandle(handle || null)
    setExternalFilePath(path || '')
  }

  const saveToDisk = async (content) => {
    try {
      if (!externalFileHandle?.createWritable) return false
      const writable = await externalFileHandle.createWritable()
      await writable.write(content ?? currentContent)
      await writable.close()
      return true
    } catch (e) {
      console.error('Failed to save to disk:', e)
      return false
    }
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
    debouncedSave,
    username,
    // presence
    subscribeToRemoteCursor,
    sendCursor,
    // chat
    messages,
    sendChat,
    // external file
    externalFileHandle,
    externalFilePath,
    setExternalFile,
    saveToDisk,
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
