import React, { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { computeDelta, validateDelta } from "../utils/collaboration";
import { Users } from "lucide-react";

const MonacoEditor = ({ userData, onToggleSidebar }) => {
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");

  const {
    currentContent,
    isLoading,
    sendChanges,
    updateContent,
    debouncedSave,
    connected,
    sendCursor,
    subscribeToRemoteCursor,
    externalFilePath,
    saveToDisk,
    sharedFolder,
  } = useEditor();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const remoteDecorationsRef = useRef({});
  const isFormattingRef = useRef(false);
  const [formatOnSave, setFormatOnSave] = useState(true);
  const isRemoteChangeRef = useRef(false);

  // Simple in-memory tab management for opened files
  const [openTabs, setOpenTabs] = useState([]); // [{ path, name, content, dirty }]
  const [activePath, setActivePath] = useState("");

  const languages = [
    { id: "javascript", name: "JavaScript", icon: "⚡", ext: ".js" },
    { id: "typescript", name: "TypeScript", icon: "🔷", ext: ".ts" },
    { id: "python", name: "Python", icon: "🐍", ext: ".py" },
    { id: "java", name: "Java", icon: "☕", ext: ".java" },
    { id: "cpp", name: "C++", icon: "⚙️", ext: ".cpp" },
  ];

  const themes = [
    { id: "vs-dark", name: "Dark", icon: "🌙" },
    { id: "vs-light", name: "Light", icon: "☀️" },
    { id: "hc-black", name: "High Contrast", icon: "⚫" },
  ];

  const handleEditorChange = useCallback(
    (value) => {
      const newValue = value || "";
      
      // Skip if this is a remote change
      if (isRemoteChangeRef.current) {
        isRemoteChangeRef.current = false;
        return;
      }

      updateContent(newValue);

      // Mark active tab as dirty and update its live content snapshot
      setOpenTabs((tabs) => {
        if (!activePath) return tabs;
        return tabs.map((t) =>
          t.path === activePath ? { ...t, content: newValue, dirty: true } : t
        );
      });

      if (formatOnSave && editorRef.current && !isFormattingRef.current && (language === 'javascript' || language === 'typescript' || language === 'json')) {
        isFormattingRef.current = true;
        editorRef.current
          .getAction('editor.action.formatDocument')
          .run()
          .finally(() => {
            isFormattingRef.current = false;
          });
      }

      const delta = computeDelta(currentContent, newValue);
      if (delta && validateDelta(delta) && connected && userData?.roomId) {
        setSyncStatus("syncing");
        sendChanges(userData.roomId, delta);
        debouncedSave(userData.roomId, newValue);
        setLastSaved(new Date());
        
        // Reset sync status after a short delay
        setTimeout(() => setSyncStatus("synced"), 500);
        setTimeout(() => setSyncStatus("idle"), 2000);
      }
    },
    [currentContent, connected, userData?.roomId, sendChanges, updateContent, debouncedSave]
  );

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    editor.onDidChangeCursorPosition(() => {
      try {
        const model = editor.getModel();
        if (!model) return;
        const pos = editor.getPosition();
        const offset = model.getOffsetAt(pos);
        if (userData?.roomId) sendCursor(userData.roomId, offset);
      } catch (_) {}
    });

    const unsubscribe = subscribeToRemoteCursor(({ username, offset }) => {
      try {
        const model = editor.getModel();
        if (!model || typeof offset !== 'number') return;
        const pos = model.getPositionAt(Math.max(0, Math.min(offset, model.getValueLength())));
        const id = `rc-${username}`;
        const decos = remoteDecorationsRef.current[id] || [];
        const newDecos = editor.deltaDecorations(decos, [
          {
            range: new monaco.Range(pos.lineNumber, 1, pos.lineNumber, 1),
            options: {
              isWholeLine: true,
              overviewRuler: { color: '#60a5fa', position: monaco.editor.OverviewRulerLane.Full },
              glyphMarginHoverMessage: { value: `$(person) ${username}` },
            },
          },
        ]);
        remoteDecorationsRef.current[id] = newDecos;
      } catch (_) {}
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  };

  // Handle remote content updates
  React.useEffect(() => {
    if (editorRef.current && currentContent !== editorRef.current.getValue()) {
      isRemoteChangeRef.current = true;
      editorRef.current.setValue(currentContent);
    }
  }, [currentContent]);

  // Track opened files as tabs when externalFilePath changes
  React.useEffect(() => {
    if (!externalFilePath) return;
    const name = externalFilePath.split("/").pop();
    setOpenTabs((tabs) => {
      const existing = tabs.find((t) => t.path === externalFilePath);
      if (existing) {
        return tabs.map((t) =>
          t.path === externalFilePath ? { ...t, name, content: currentContent, dirty: false } : t
        );
      }
      return [
        ...tabs,
        { path: externalFilePath, name, content: currentContent, dirty: false },
      ];
    });
    setActivePath(externalFilePath);
  }, [externalFilePath]);

  // When switching active tab, load its content into editor/context
  const activateTab = (path) => {
    const tab = openTabs.find((t) => t.path === path);
    if (!tab) return;
    setActivePath(path);
    updateContent(tab.content || "");
  };

  const closeTab = (path) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t.path !== path);
      if (path === activePath) {
        const fallback = next[next.length - 1];
        if (fallback) {
          setActivePath(fallback.path);
          updateContent(fallback.content || "");
        } else {
          setActivePath("");
          updateContent("");
        }
      }
      return next;
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-900">
      {/* Top Bar */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 p-4 flex items-center justify-between shadow-2xl shadow-slate-900/50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onToggleSidebar} 
            className="px-3 py-2 text-sm bg-slate-700/80 hover:bg-slate-600 text-white rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-slate-600/25 flex items-center gap-2 btn-hover glass-dark"
          >
            <span className="text-xs">☰</span>
            Panels
          </button>
          
          {/* Language Picker */}
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white text-sm focus-ring transition-all duration-300 glass-dark"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Picker */}
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm font-medium">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white text-sm focus-ring transition-all duration-300 glass-dark"
            >
              {themes.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.icon} {th.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sync Status */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50 glass-dark">
            <div className={`w-3 h-3 rounded-full ${
              syncStatus === 'idle' ? 'bg-gray-400' : 
              syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse-glow' : 
              'bg-green-400 animate-pulse-glow'
            }`}></div>
            <span className="text-sm text-gray-300 font-medium">
              {syncStatus === 'idle' ? 'Ready' : 
               syncStatus === 'syncing' ? 'Syncing...' : 
               'Synced'}
            </span>
          </div>
          
          {/* Shared Folder Indicator */}
          {sharedFolder && (
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-sm text-blue-300 glass-dark animate-scale-in">
              <Users size={16} />
              <span className="font-medium">Shared by {sharedFolder.openedBy}</span>
            </div>
          )}
          
          {/* External File Path */}
          {externalFilePath && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50 glass-dark">
              <span className="text-xs text-gray-400 truncate max-w-[200px]" title={externalFilePath}>
                📁 {externalFilePath}
              </span>
            </div>
          )}
          
          {/* Format on Save Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-300 bg-slate-700/50 px-3 py-2 rounded-xl border border-slate-600/50 glass-dark">
            <input 
              type="checkbox" 
              className="accent-blue-600 w-4 h-4" 
              checked={formatOnSave} 
              onChange={(e) => setFormatOnSave(e.target.checked)} 
            />
            Format on save
          </label>
          
          {/* Save to Disk Button */}
          {externalFilePath && (
            <button 
              onClick={() => saveToDisk(currentContent)} 
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-emerald-600/25 flex items-center gap-2 btn-hover"
            >
              💾 Save to Disk
            </button>
          )}
          
          {/* Last Saved Time */}
          <div className="text-sm text-gray-400 bg-slate-700/50 px-3 py-2 rounded-xl border border-slate-600/50 glass-dark">
            <div className="text-xs text-gray-500 mb-1">Last Saved</div>
            <div className="font-mono">
              {lastSaved ? lastSaved.toLocaleTimeString() : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-stretch overflow-x-auto">
        {openTabs.length === 0 ? (
          <div className="text-sm text-slate-500 px-4 flex items-center">No files open</div>
        ) : (
          openTabs.map((t) => {
            const isActive = t.path === activePath;
            return (
              <div
                key={t.path}
                className={`group flex items-center min-w-[140px] max-w-[240px] px-3 cursor-pointer select-none border-r border-slate-800 h-full ${
                  isActive ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
                }`}
                onClick={() => activateTab(t.path)}
                title={t.path}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
                  <span className="text-sm truncate leading-none">{t.name}</span>
                  {t.dirty && <span className="text-indigo-400 text-sm leading-none">•</span>}
                </div>
                <button
                  className={`ml-1 w-10 h-10 cursor-pointer rounded-sm transition-opacity flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-slate-700/70 hover:text-red-400 text-base leading-none`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.path);
                  }}
                  title="Close"
                >
                  x
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-2">
        <div className="h-full rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900 shadow-2xl shadow-slate-900/50 card-hover">
          <Editor
            height="100%"
            width="100%"
            language={language}
            value={currentContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              minimap: { enabled: false },
              fontSize,
              wordWrap: "on",
              automaticLayout: true,
              lineNumbers: "on",
              cursorStyle: "line",
              fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
              lineHeight: Math.round(fontSize * 1.5),
              padding: { top: 20, bottom: 20 },
              scrollbar: { 
                vertical: "visible", 
                horizontal: "visible",
                verticalScrollbarSize: 12,
                horizontalScrollbarSize: 12,
              },
              renderLineHighlight: "all",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              folding: true,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollBeyondLastLine: false,
              roundedSelection: false,
              readOnly: false,
              contextmenu: true,
              mouseWheelZoom: true,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              wordBasedSuggestions: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MonacoEditor;
