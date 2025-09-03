import React, { useState } from 'react'
import MonacoEditor from './Monaco'
import Sidebar from './Sidebar'

const WorkspaceShell = ({ userData, onLeave }) => {
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState(90)

  return (
    <div className="flex flex-col w-screen h-screen  bg-slate-950">

      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-font text-xl font-extrabold text-gradient-blue tracking-wide">codeSync</div>
        </div>
        <div className="text-xs text-slate-400 font-mono">Connected Workspace</div>
      </div>

      {/* Main area */}

      <div className="flex flex-row flex-1 min-h-0 ">

        {/* Side Panel */}
        {panelOpen && (
          <div className=" border-r border-slate-800 bg-slate-900" style={{ panelWidth }}
          >
            <Sidebar userData={userData} onLeave={onLeave} onCollapse={() => setPanelOpen(false)} />
          </div>
        )}
        {/* Editor */}
        <div className='flex-1 min-w-0 min-h-0 flex' >

          <MonacoEditor className="w-full h-full" userData={userData} onToggleSidebar={() => setPanelOpen((v) => !v)} onLeave={onLeave} />
        </div>
      </div>
      {/* Status bar */}
      <div className="h-6 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 px-3 flex items-center justify-between font-mono">
        <div>codeSync • Ready</div>
        <div>UTF-8  |  LF</div>
      </div>
    </div>

  )
}

export default WorkspaceShell


