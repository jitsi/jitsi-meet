/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */
import React, { Suspense, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { readNextRoundContext } from '../../../nextround/anticheat.web';
import { setCodeEditorOpen } from '../../actions.web';
import { getCollabRoom, getCollabServerUrl, isCodeEditorEnabled, isCodeEditorOpen } from '../../functions';

const LazyCodeEditorPanel = React.lazy(() =>
    import(/* webpackChunkName: "code-editor" */ './CodeEditorPanel.web'));

/**
 * Overlay shell for the collaborative code editor. Kept out of the lazy chunk so
 * that toggling it (and reading redux) costs nothing until it's actually opened;
 * the heavy CodeMirror + Yjs bundle loads only when `isOpen` becomes true.
 *
 * @returns {JSX.Element | null}
 */
const CodeEditor = () => {
    const dispatch = useDispatch();
    const enabled = useSelector(isCodeEditorEnabled);
    const isOpen = useSelector(isCodeEditorOpen);
    const collabServerUrl = useSelector(getCollabServerUrl);
    const room = useSelector(getCollabRoom);
    const nr = useSelector((state: IReduxState) => readNextRoundContext(state));
    const localName = useSelector((state: IReduxState) => getLocalParticipant(state)?.name) || 'Guest';

    const handleClose = useCallback(() => dispatch(setCodeEditorOpen(false)), [ dispatch ]);

    if (!enabled || !isOpen) {
        return null;
    }

    return (
        <div
            style = {{
                position: 'absolute',
                inset: 0,
                zIndex: 250,
                display: 'flex',
                flexDirection: 'column',
                background: '#1e1e1e'
            }}>
            <Suspense
                fallback = { <div style = {{ color: '#ddd', padding: 24 }}>Loading editor…</div> }>
                <LazyCodeEditorPanel
                    apiBase = { nr?.apiBase }
                    collabServerUrl = { collabServerUrl }
                    eventsToken = { nr?.eventsToken }
                    interviewId = { nr?.interviewId }
                    localName = { localName }
                    onClose = { handleClose }
                    role = { nr?.role }
                    room = { room } />
            </Suspense>
        </div>
    );
};

export default CodeEditor;
