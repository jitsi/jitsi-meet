import React, { useState } from 'react';
import { Dialog } from '../../../base/dialog';

export default function NotepadDialog() {
    const [notes, setNotes] = useState('');
    const [summary, setSummary] = useState('');

    const summarize = async () => {
        const response = await fetch('/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: notes })
        });

        const data = await response.json();
        setSummary(data.summary);
    };

    return (
        <Dialog
            title="AI Notepad"
            okTitle="Close"
            submitDisabled={false}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                    placeholder="Write meeting notes here…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', height: 150 }} />

                <button onClick={summarize}>
                    Summarize Notes
                </button>

                <textarea
                    placeholder="AI Summary Output"
                    value={summary}
                    readOnly
                    style={{ width: '100%', height: 120, background: '#f0f0f0' }} />
            </div>
        </Dialog>
    );
}
