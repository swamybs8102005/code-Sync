import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { validateDelta, applyDelta } from '../utils/collaboration'

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
  const [roomId, setRoomId] = useState('')
  const [externalFileHandle, setExternalFileHandle] = useState(null)
  const [externalFilePath, setExternalFilePath] = useState('')
  const [sharedFolder, setSharedFolder] = useState(null)
  const [roomOwner, setRoomOwner] = useState(null)
  const socketRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const lastChangeRef = useRef(null)

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
      setRoomId(roomId)

      const s = socketRef.current
      // prevent duplicate listeners and register before join
      s.off('load-document')
      s.off('receive-changes')
      s.off('user-count')
      s.off('users')
      s.off('shared-folder')
      s.off('room-owner')
      s.off('file-request')
      s.off('file-content')

      s.on('load-document', (initial) => {
        setCurrentContent(initial || '')
        setIsLoading(false)
        lastChangeRef.current = initial || ''
      })

      s.on('receive-changes', (delta) => {
        if (!validateDelta(delta)) {
          console.warn('Invalid delta received:', delta)
          return
        }
        
        setCurrentContent((prev) => {
          const newContent = applyDelta(prev, delta)
          lastChangeRef.current = newContent
          return newContent
        })
      })

      s.on('user-count', () => {})

      s.on('users', (list) => {
        setUsers(Array.isArray(list) ? list : [])
      })

      s.on('shared-folder', (folderData) => {
        setSharedFolder(folderData)
        console.log('📁 Shared folder received:', folderData)
      })

      s.on('room-owner', (ownerInfo) => {
        setRoomOwner(ownerInfo || null)
        console.log('⭐ Room owner updated:', ownerInfo)
      })

      // Non-owner receives file content
      s.on('file-content', ({ path, content, error }) => {
        if (error) {
          console.error('❌ File load error:', error)
          return
        }
        if (typeof content === 'string') {
          setCurrentContent(content)
          lastChangeRef.current = content
        }
      })

      s.emit('join', { roomId, username })
    }
  }

  const sendChanges = (roomId, delta) => {
    if (socketRef.current && connected && validateDelta(delta)) {
      socketRef.current.emit('send-changes', { roomId, delta })
    }
  }

  const shareFolder = (roomId, folderTree, folderPath) => {
    if (socketRef.current && connected && folderTree) {
      socketRef.current.emit('share-folder', { roomId, folderTree, folderPath })
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
    if (!message) return;
    const payload = { roomId, username, message, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, payload]);
    if (socketRef.current) {
      try { socketRef.current.emit('chat-message', payload); } catch (_) {}
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

  // Owner: register a handler to read files locally and respond over socket
  const registerFileRequestHandler = (getFileByPath) => {
    const s = socketRef.current
    if (!s) return () => {}
    const handler = async ({ requesterId, path }) => {
      try {
        const content = await getFileByPath(path)
        s.emit('file-content', { roomId, requesterId, path, content })
      } catch (e) {
        s.emit('file-content', { roomId, requesterId, path, error: String(e?.message || e) })
      }
    }
    s.on('file-request', handler)
    return () => s.off('file-request', handler)
  }

  // Non-owner: request a file by path from the owner
  const requestFile = (path) => {
    if (socketRef.current && connected && typeof path === 'string') {
      socketRef.current.emit('request-file', { roomId, path })
    }
  }

  const value = {
    connected,
    users,
    currentContent,
    isLoading,
    roomId,
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
    // shared folder
    sharedFolder,
    shareFolder,
    roomOwner,
    isOwner: !!roomOwner && socketRef.current?.id === roomOwner.socketId,
    registerFileRequestHandler,
    requestFile,
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
