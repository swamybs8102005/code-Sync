import React, { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { computeDelta } from "../utils/collaboration";

const MonacoEditor = ({ userData }) => {
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
  } = useEditor();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

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
  };

  return (
    <div className="flex-1 h-full flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
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

        <div className="text-xs text-gray-400">
          Saved: {lastSaved ? lastSaved.toLocaleTimeString() : "Never"}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading collaborative editor...</p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default MonacoEditor;
