import React, { useRef, useState, useEffect } from 'react'
import { FolderOpen, FileText, ChevronDown, ChevronRight, RefreshCcw, Users, Share2 } from 'lucide-react'
import { useEditor } from '../context/EditorContext'

const isReadableText = (name) => /\.(js|ts|tsx|jsx|json|md|txt|py|java|cpp|c|cs|html|css|sh|yml|yaml)$/i.test(name)

const LocalFiles = () => {
  const fileInputRef = useRef(null)
  const [tree, setTree] = useState(null)
  const [expanded, setExpanded] = useState({})
  const { updateContent, setExternalFile, sharedFolder, shareFolder, isOwner, roomOwner, roomId, registerFileRequestHandler, requestFile } = useEditor()

  const toggle = (path) => setExpanded((e) => ({ ...e, [path]: !e[path] }))

  const buildTreeFromDirectoryHandle = async (dirHandle, basePath = dirHandle.name) => {
    const children = []
    for await (const [name, handle] of dirHandle.entries()) {
      const path = basePath + '/' + name
      if (handle.kind === 'directory') {
        children.push({ name, path, kind: 'directory', handle, children: await buildTreeFromDirectoryHandle(handle, path) })
      } else {
        children.push({ name, path, kind: 'file', handle })
      }
    }
    children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1))
    return children
  }

  const toSerializableTree = (node) => {
    if (!node) return null
    if (node.kind === 'directory') {
      return {
        name: node.name,
        path: node.path,
        kind: 'directory',
        children: Array.isArray(node.children) ? node.children.map(toSerializableTree) : []
      }
    }
    return { name: node.name, path: node.path, kind: 'file' }
  }

  const openFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker()
                const children = await buildTreeFromDirectoryHandle(dirHandle)
        const folderTree = { name: dirHandle.name, path: dirHandle.name, kind: 'directory', handle: dirHandle, children }
        
        setTree(folderTree)
        setExpanded({ [dirHandle.name]: true })
        
        // Share folder with other users in the room
        if (roomId) {
          console.log('📁 Sharing folder with room:', roomId, folderTree)
          const serializable = toSerializableTree(folderTree)
          shareFolder(roomId, serializable, dirHandle.name)
        } else {
          console.log('⚠️ No room ID available for folder sharing')
        }
        
        return
        } catch (err) {
          // Blocked by permissions policy or user canceled - fallback to input
        }
      }
      fileInputRef.current?.click()
    } catch (_) {
      fileInputRef.current?.click()
    }
  }

  const onFilesChosen = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    // Build a simple flat tree grouped by folders from webkitdirectory
    const root = { name: files[0].webkitRelativePath.split('/')[0], path: '', kind: 'directory', children: [] }
    const map = new Map()
    map.set('', root)
    for (const f of files) {
      const parts = f.webkitRelativePath.split('/')
      let currentPath = ''
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const nextPath = currentPath ? currentPath + '/' + part : part
        if (i === parts.length - 1) {
          const parent = map.get(currentPath)
          parent.children.push({ name: part, path: nextPath, kind: 'file', file: f })
        } else if (!map.has(nextPath)) {
          const dir = { name: part, path: nextPath, kind: 'directory', children: [] }
          map.get(currentPath).children.push(dir)
          map.set(nextPath, dir)
        }
        currentPath = nextPath
      }
    }
    setTree(root)
    setExpanded({ [root.name]: true })
    
    // Share folder with other users in the room
    if (roomId) {
      console.log('📁 Sharing file tree with room:', roomId, root)
      const serializable = toSerializableTree(root)
      shareFolder(roomId, serializable, root.name)
    } else {
      console.log('⚠️ No room ID available for folder sharing')
    }
  }

  const loadFile = async (node) => {
    try {
      let file
      if (node.handle?.getFile) file = await node.handle.getFile()
      else if (node.file) file = node.file
      if (!file) return
      if (!isReadableText(file.name)) {
        alert('This file type may not render correctly as text. Attempting to open as text.')
      }
      const text = await file.text()
      updateContent(text)
      setExternalFile(node.handle || null, node.path)
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }

  const ownerGetFileByPath = async (path) => {
    const walk = (n) => {
      if (!n) return null
      if (n.path === path) return n
      if (n.children) {
        for (const c of n.children) {
          const found = walk(c)
          if (found) return found
        }
      }
      return null
    }
    const node = walk(tree)
    if (!node) throw new Error('File not found in owner tree')
    let file
    if (node.handle?.getFile) file = await node.handle.getFile()
    else if (node.file) file = node.file
    if (!file) throw new Error('File handle unavailable')
    return await file.text()
  }

  useEffect(() => {
    if (!isOwner || !tree) return
    const off = registerFileRequestHandler(ownerGetFileByPath)
    return off
  }, [isOwner, tree])

  const renderNode = (node) => {
    if (!node) return null
    if (node.kind === 'directory') {
      const isOpen = !!expanded[node.path]
      return (
        <div key={node.path} className="ml-2">
          <button 
            onClick={() => toggle(node.path)} 
            className="flex items-center gap-2 text-gray-200 hover:text-white cursor-pointer w-full text-left p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-300"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <FolderOpen size={14} className="text-yellow-400 flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && (
            <div className="ml-4 mt-2 space-y-2">
              {node.children?.map((c) => renderNode(c))}
            </div>
          )}
        </div>
      )
    }
    const disabled = !!sharedFolder && !isOwner
    return (
      <button
        key={node.path}
        onClick={() => {
          if (disabled) {
            if (node.kind === 'file') requestFile(node.path)
            return
          }
          loadFile(node)
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl w-full text-left transition-all duration-300 ${disabled ? 'text-gray-500 bg-slate-800/40 cursor-pointer' : 'text-gray-300 hover:text-white cursor-pointer hover:bg-slate-700/50'}`}
        title={disabled ? 'Requesting from owner...' : ''}
      >
        <FileText size={14} className={`${disabled ? 'text-gray-400' : 'text-blue-300'} flex-shrink-0`} />
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  // Use shared folder if available, otherwise use local tree
  const displayTree = sharedFolder && !isOwner ? sharedFolder.tree : tree
  const displayExpanded = sharedFolder && !isOwner ? { [sharedFolder.tree.name]: true } : expanded

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-sm shadow-2xl shadow-slate-900/50 card-hover glass-dark">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 text-white font-semibold">
          <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
            <FolderOpen size={24} className="text-yellow-400" />
          </div>
          <div>
            <div className="text-xl">{sharedFolder ? 'Shared Files' : 'Local Files'}</div>
            {sharedFolder && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Users size={14} />
                <span>Shared by {sharedFolder.openedBy}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!sharedFolder && (
            <>
              <button 
                onClick={openFolder} 
                className={`px-5 py-3 rounded-xl text-sm cursor-pointer flex items-center gap-2 transition-all duration-300 shadow-lg btn-hover ${isOwner ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:shadow-blue-600/25' : 'bg-slate-700 text-gray-300 cursor-not-allowed'}`}
                disabled={!isOwner}
              >
                <FolderOpen size={16} /> Open Folder
              </button>
              <button 
                onClick={() => setExpanded({})} 
                className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg btn-hover"
                title="Collapse All"
              >
                <RefreshCcw size={16} />
              </button>
            </>
          )}
          {sharedFolder && (
            <button 
              onClick={() => window.location.reload()} 
              className="px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm cursor-pointer flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg btn-hover"
              title="Return to local files"
            >
              <Share2 size={16} /> Local Files
            </button>
          )}
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} webkitdirectory="" multiple onChange={onFilesChosen} />
      
      <div className="max-h-80 overflow-auto border border-slate-600/50 rounded-xl p-4 bg-slate-900/50 glass-dark">
        {displayTree ? (
          <div className="animate-fade-in">
            {sharedFolder && (
              <div className="text-sm text-gray-300 mb-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl glass-dark">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-300">📁</span>
                  <span className="font-medium text-blue-200">Shared Folder</span>
                </div>
                <div className="text-gray-400">
                  Opened by <span className="text-blue-300 font-medium">{sharedFolder.openedBy}</span> at {new Date(sharedFolder.openedAt).toLocaleTimeString()}
                  {roomOwner && (
                    <span className="ml-2 text-xs text-gray-500">(Owner: {roomOwner.username}{isOwner ? ' - You' : ''})</span>
                  )}
                </div>
              </div>
            )}
            {renderNode(displayTree)}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <FolderOpen size={40} className="mx-auto mb-4 text-gray-500 animate-float" />
            <div className="text-base mb-2">
              {sharedFolder ? 'No shared folder available.' : 'No folder opened.'}
            </div>
            {!sharedFolder && (
              <div className="text-sm text-gray-500">Click "Open Folder" to get started</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocalFiles
