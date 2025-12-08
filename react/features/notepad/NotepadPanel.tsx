import React, { useState, useEffect } from 'react';

interface Props {
    onClose: () => void;
}

export default function NotepadPanel({ onClose }: Props) {
    const [text, setText] = useState<string>(() => {
        try {
            return localStorage.getItem("jitsi_notepad_text") || "";
        } catch {
            return "";
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("jitsi_notepad_text", text);
        } catch {}
    }, [text]);

    return (
        <div
            style={{
                width: 320,
                height: 420,
                background: 'white',
                padding: 16,
                borderRadius: 10,
                position: 'fixed',
                right: 20,
                bottom: 80,
                boxShadow: '0 0 12px rgba(0,0,0,0.4)',
                zIndex: 9999
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Notepad</h3>
                <button onClick={onClose}>X</button>
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                    width: '100%',
                    height: '330px',
                    padding: 10,
                    resize: 'none'
                }}
            />
        </div>
    );
}
