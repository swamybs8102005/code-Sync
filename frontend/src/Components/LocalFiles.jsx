import React, { useRef, useState } from 'react'
import { FolderOpen, FileText, ChevronDown, ChevronRight, RefreshCcw } from 'lucide-react'
import { useEditor } from '../context/EditorContext'

const isReadableText = (name) => /\.(js|ts|tsx|jsx|json|md|txt|py|java|cpp|c|cs|html|css|sh|yml|yaml)$/i.test(name)

const LocalFiles = () => {
  const fileInputRef = useRef(null)
  const [tree, setTree] = useState(null)
  const [expanded, setExpanded] = useState({})
  const { updateContent, setExternalFile } = useEditor()

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

  const openFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker()
          const children = await buildTreeFromDirectoryHandle(dirHandle)
          setTree({ name: dirHandle.name, path: dirHandle.name, kind: 'directory', handle: dirHandle, children })
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

  const renderNode = (node) => {
    if (!node) return null
    if (node.kind === 'directory') {
      const isOpen = !!expanded[node.path]
      return (
        <div key={node.path} className="ml-2">
          <button onClick={() => toggle(node.path)} className="flex items-center gap-1 text-gray-200 hover:text-white cursor-pointer">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <FolderOpen size={14} className="text-yellow-400" />
            <span>{node.name}</span>
          </button>
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {node.children?.map((c) => renderNode(c))}
            </div>
          )}
        </div>
      )
    }
    return (
      <button
        key={node.path}
        onClick={() => loadFile(node)}
        className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-slate-700 w-full text-left"
      >
        <FileText size={14} className="text-blue-300" />
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-md p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <FolderOpen size={18} className="text-yellow-400" /> Local Files
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openFolder} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs cursor-pointer flex items-center gap-1"><FolderOpen size={14} /> Open Folder</button>
          <button onClick={() => setExpanded({})} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs cursor-pointer" title="Collapse"><RefreshCcw size={14} /></button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} webkitdirectory="" multiple onChange={onFilesChosen} />
      <div className="max-h-56 overflow-auto">
        {tree ? renderNode(tree) : <div className="text-gray-400">No folder opened.</div>}
      </div>
    </div>
  )
}

export default LocalFiles
