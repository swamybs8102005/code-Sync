import React, { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { computeDelta } from "../utils/collaboration";

const MonacoEditor = ({ userData, onToggleSidebar }) => {
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState(null);

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
  } = useEditor();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const remoteDecorationsRef = useRef({});
  const isFormattingRef = useRef(false);
  const [formatOnSave, setFormatOnSave] = useState(true);

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
      updateContent(newValue);

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
      if (delta && connected && userData?.roomId) {
        sendChanges(userData.roomId, delta);
        debouncedSave(userData.roomId, newValue);
        setLastSaved(new Date());
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

  return (
    <div className="flex-1 h-full flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer">Panels</button>
          {/* Language Picker */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Picker */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {themes.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.icon} {th.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {externalFilePath && (
            <span className="text-xs text-gray-400 truncate max-w-[220px]" title={externalFilePath}>{externalFilePath}</span>
          )}
          <label className="flex items-center gap-1 text-xs text-gray-300">
            <input type="checkbox" className="accent-blue-600" checked={formatOnSave} onChange={(e) => setFormatOnSave(e.target.checked)} />
            Format on save
          </label>
          {externalFilePath && (
            <button onClick={() => saveToDisk(currentContent)} className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm cursor-pointer">Save to Disk</button>
          )}
          <div className="text-xs text-gray-400">
            Saved: {lastSaved ? lastSaved.toLocaleTimeString() : "Never"}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
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
            scrollbar: { vertical: "visible", horizontal: "visible" },
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            folding: true,
          }}
        />
      </div>

    </div>
  );
};

export default MonacoEditor;
