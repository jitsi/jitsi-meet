import React, { useState, useEffect } from 'react';

export default function NotepadPanel({ onClose }) {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem("jitsi_notepad_text") || ""; }
    catch { return ""; }
  });

  useEffect(() => {
    try { localStorage.setItem("jitsi_notepad_text", text); }
    catch {}
  }, [text]);

  return (
    <div style={{
      width: "300px",
      height: "400px",
      background: "white",
      padding: "16px",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0,0,0,0.2)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>Notepad</h3>
        <button onClick={onClose}>X</button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          height: "320px",
          resize: "none",
          marginTop: "10px",
          padding: "10px"
        }}
      />
    </div>
  );
}
