import React, { useState, useEffect } from 'react';
import AISummarizer from './AISummarizer';

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

    // Handler for when AI summary is generated
    const handleSummaryGenerated = (summary: string) => {
        // Optional: Append summary to the notepad
        const timestamp = new Date().toLocaleString();
        const formattedSummary = `\n\n━━━━━ AI SUMMARY (${timestamp}) ━━━━━\n${summary}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        setText(prev => prev + formattedSummary);
    };

    return (
        <div
            style={{
                width: 360,
                height: 580,
                background: 'white',
                padding: 16,
                borderRadius: 10,
                position: 'fixed',
                right: 20,
                bottom: 80,
                boxShadow: '0 0 12px rgba(0,0,0,0.4)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 12,
                borderBottom: '2px solid #e9ecef',
                paddingBottom: 8
            }}>
                <h3 style={{ margin: 0 }}>📝 Notepad</h3>
                <button 
                    onClick={onClose}
                    style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5,
                        padding: '5px 12px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Textarea */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing your meeting notes here...

📝 Tips:
• Note key discussion points
• Track decisions made
• List action items"
                style={{
                    width: '100%',
                    height: '250px',
                    padding: 10,
                    resize: 'none',
                    border: '1px solid #ced4da',
                    borderRadius: 6,
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            />

            {/* Character count */}
            <div style={{ 
                fontSize: 11, 
                color: '#6c757d', 
                textAlign: 'right',
                marginTop: 4
            }}>
                {text.length} characters
            </div>

            {/* AI Summarizer Component */}
            <div style={{ 
                flex: 1, 
                overflowY: 'auto',
                marginTop: 8
            }}>
                <AISummarizer 
                    notepadContent={text}
                    onSummaryGenerated={handleSummaryGenerated}
                />
            </div>
        </div>
    );
}
