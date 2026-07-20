/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { go } from '@codemirror/lang-go';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { CODE_EDITOR_LANGUAGES, DEFAULT_LANGUAGE } from '../../constants';

interface IProps {
    apiBase?: string;
    collabServerUrl: string;
    eventsToken?: string;
    interviewId?: string;
    localName: string;
    onClose: () => void;
    role?: string;
    room: string;
}

const USER_COLORS = [
    '#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352', '#9ac2c9', '#8acb88', '#1be7ff'
];

/**
 * Maps a language id to its CodeMirror language extension.
 *
 * @param {string} langId - The language id.
 * @returns {Extension}
 */
function langExtension(langId: string): Extension {
    const cm = CODE_EDITOR_LANGUAGES.find(l => l.id === langId)?.cm;

    switch (cm) {
    case 'python':
        return python();
    case 'javascript':
        return javascript({ typescript: langId === 'typescript' });
    case 'cpp':
        return cpp();
    case 'java':
        return java();
    case 'go':
        return go();
    case 'rust':
        return rust();
    default:
        return [];
    }
}

/**
 * The collaborative code editor panel: CodeMirror 6 bound to a shared Yjs doc
 * (code + language + output) over the code-collab relay, with a language picker,
 * a sandboxed Run (proxied to Piston through nextround-api), and anti-cheat
 * paste reporting. Lazy-loaded so CodeMirror/Yjs never bloat app.bundle.
 *
 * @param {IProps} props - Component props.
 * @returns {JSX.Element}
 */
const CodeEditorPanel = ({
    apiBase, collabServerUrl, eventsToken, interviewId, localName, onClose, role, room
}: IProps) => {
    const editorElRef = useRef<HTMLDivElement>(null);
    const docRef = useRef<Y.Doc>();
    const providerRef = useRef<WebsocketProvider>();
    const viewRef = useRef<EditorView>();
    const ytextRef = useRef<Y.Text>();
    const ymetaRef = useRef<Y.Map<unknown>>();
    const youtputRef = useRef<Y.Text>();
    const langCompartmentRef = useRef<Compartment>();

    const [ language, setLanguage ] = useState<string>(DEFAULT_LANGUAGE);
    const [ output, setOutput ] = useState<string>('');
    const [ running, setRunning ] = useState(false);
    const [ connected, setConnected ] = useState(false);

    const canRun = Boolean(apiBase && interviewId && eventsToken);

    /**
     * Best-effort anti-cheat event.
     *
     * @param {string} eventType - The event label.
     * @returns {void}
     */
    const postEvent = useCallback((eventType: string) => {
        if (!apiBase || !interviewId || !eventsToken) {
            return;
        }
        fetch(`${apiBase}/api/interviews/${encodeURIComponent(interviewId)}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${eventsToken}`
            },
            body: JSON.stringify({ event_type: eventType }),
            keepalive: true
        }).catch(() => { /* best-effort */ });
    }, [ apiBase, interviewId, eventsToken ]);

    /**
     * Writes text into the shared output field so both parties see it.
     *
     * @param {string} text - The output text.
     * @returns {void}
     */
    const writeOutput = useCallback((text: string) => {
        const yo = youtputRef.current;
        const doc = docRef.current;

        if (!yo || !doc) {
            return;
        }
        doc.transact(() => {
            yo.delete(0, yo.length);
            yo.insert(0, text);
        });
    }, []);

    useEffect(() => {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(collabServerUrl, room, doc);
        const ytext = doc.getText('code');
        const ymeta = doc.getMap('meta');
        const youtput = doc.getText('output');
        const langCompartment = new Compartment();

        docRef.current = doc;
        providerRef.current = provider;
        ytextRef.current = ytext;
        ymetaRef.current = ymeta;
        youtputRef.current = youtput;
        langCompartmentRef.current = langCompartment;

        const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

        provider.awareness.setLocalStateField('user', { name: localName, color, colorLight: `${color}33` });

        provider.on('status', (e: { status: string; }) => setConnected(e.status === 'connected'));
        provider.once('sync', () => {
            if (!ymeta.get('language')) {
                ymeta.set('language', DEFAULT_LANGUAGE);
            }
        });

        const initialLang = (ymeta.get('language') as string) || DEFAULT_LANGUAGE;

        setLanguage(initialLang);

        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                history(),
                keymap.of([ ...defaultKeymap, ...historyKeymap, indentWithTab ]),
                oneDark,
                langCompartment.of(langExtension(initialLang)),
                yCollab(ytext, provider.awareness)
            ]
        });

        const view = new EditorView({ state, parent: editorElRef.current as HTMLElement });

        viewRef.current = view;

        const metaObserver = () => {
            const l = (ymeta.get('language') as string) || DEFAULT_LANGUAGE;

            setLanguage(l);
            view.dispatch({ effects: langCompartment.reconfigure(langExtension(l)) });
        };

        ymeta.observe(metaObserver);

        const outObserver = () => setOutput(youtput.toString());

        youtput.observe(outObserver);
        setOutput(youtput.toString());

        const onPaste = () => {
            if (role === 'candidate') {
                postEvent('Candidate pasted into code editor');
            }
        };

        view.dom.addEventListener('paste', onPaste);

        return () => {
            ymeta.unobserve(metaObserver);
            youtput.unobserve(outObserver);
            view.dom.removeEventListener('paste', onPaste);
            view.destroy();
            provider.destroy();
            doc.destroy();
        };

        // Set up once; identity props don't change for a given open session.
    }, []);

    const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        ymetaRef.current?.set('language', e.target.value);
    }, []);

    /**
     * Runs the current code in the sandbox and shares the result.
     *
     * @returns {Promise<void>}
     */
    const run = useCallback(async () => {
        if (!canRun) {
            writeOutput('Run is unavailable (no interview context).');

            return;
        }
        const code = ytextRef.current?.toString() ?? '';

        setRunning(true);
        writeOutput('Running…');
        postEvent(`Ran code (${language})`);

        try {
            const res = await fetch(
                `${apiBase}/api/interviews/${encodeURIComponent(interviewId as string)}/execute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${eventsToken}`
                    },
                    body: JSON.stringify({ language, code })
                });
            const body = await res.json();

            if (!res.ok) {
                writeOutput(`Error: ${body.error || res.status}`);
            } else {
                const parts: string[] = [];

                if (body.compile?.stderr) {
                    parts.push(body.compile.stderr);
                }
                parts.push(body.run?.stdout || '');
                if (body.run?.stderr) {
                    parts.push(body.run.stderr);
                }
                writeOutput(parts.join('').trim() || '(no output)');
            }
        } catch (e) {
            writeOutput(`Error: ${String(e)}`);
        } finally {
            setRunning(false);
        }
    }, [ canRun, language, apiBase, interviewId, eventsToken, postEvent, writeOutput ]);

    return (
        <div style = {{ display: 'flex', flexDirection: 'column', height: '100%', color: '#e8eaed' }}>
            <div
                style = {{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: '#252526',
                    borderBottom: '1px solid #333'
                }}>
                <b style = {{ fontSize: 13 }}>NextRound code editor</b>
                <select
                    onChange = { handleLanguageChange }
                    style = {{ background: '#3c3c3c', color: '#eee', border: '1px solid #555', borderRadius: 4, padding: '3px 6px' }}
                    value = { language }>
                    { CODE_EDITOR_LANGUAGES.map(l => (
                        <option
                            key = { l.id }
                            value = { l.id }>{ l.label }</option>
                    )) }
                </select>
                <button
                    disabled = { running || !canRun }
                    onClick = { run }
                    style = {{
                        background: running ? '#555' : '#0e8a16',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 14px',
                        cursor: running || !canRun ? 'default' : 'pointer',
                        fontWeight: 600
                    }}
                    title = { canRun ? 'Run' : 'Run unavailable outside an interview' }>
                    { running ? 'Running…' : '▶ Run' }
                </button>
                <span
                    style = {{ fontSize: 11, opacity: 0.7 }}
                    title = 'Collaboration status'>
                    { connected ? '● live' : '○ connecting…' }
                </span>
                <span style = {{ flex: 1 }} />
                <button
                    onClick = { onClose }
                    style = {{ background: 'transparent', color: '#ccc', border: '1px solid #555', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                    Close
                </button>
            </div>
            <div
                ref = { editorElRef }
                style = {{ flex: 1, overflow: 'auto', minHeight: 0, fontSize: 14 }} />
            <div
                style = {{
                    height: '28%',
                    minHeight: 100,
                    borderTop: '1px solid #333',
                    background: '#1b1b1b',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                <div style = {{ padding: '4px 12px', fontSize: 11, opacity: 0.6, borderBottom: '1px solid #2a2a2a' }}>Output</div>
                <pre
                    style = {{
                        margin: 0,
                        padding: '8px 12px',
                        overflow: 'auto',
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap'
                    }}>
                    { output }
                </pre>
            </div>
        </div>
    );
};

export default CodeEditorPanel;
