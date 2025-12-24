import { ExcalidrawApp } from '@jitsi/excalidraw';
import i18next from 'i18next';
import React, { useCallback, useRef } from 'react';

import { WHITEBOARD_UI_OPTIONS } from '../../constants';

/**
 * Whiteboard wrapper for mobile.
 *
 * @returns {JSX.Element}
 */
const WhiteboardWrapper = ({
    className,
    collabDetails,
    collabServerUrl,
    localParticipantName,
    onClose // Add this prop
}: {
    className?: string;
    collabDetails: {
        roomId: string;
        roomKey: string;
    };
    collabServerUrl: string;
    localParticipantName: string;
    onClose?: () => void; // Add this prop
}) => {
    const excalidrawRef = useRef<any>(null);
    const excalidrawAPIRef = useRef<any>(null);
    const collabAPIRef = useRef<any>(null);

    const getExcalidrawAPI = useCallback(excalidrawAPI => {
        if (excalidrawAPIRef.current) {
            return;
        }
        excalidrawAPIRef.current = excalidrawAPI;
    }, []);

    const getCollabAPI = useCallback(collabAPI => {
        if (collabAPIRef.current) {
            return;
        }
        collabAPIRef.current = collabAPI;
        collabAPIRef.current.setUsername(localParticipantName);
    }, [ localParticipantName ]);

    return (
        <div className = { className }>
            <div className = 'excalidraw-wrapper'>
                {/* Add close button for mobile */}
                {onClose && (
                    <button
                        className = 'whiteboard-close-btn'
                        onClick = { onClose }
                        aria-label = 'Close whiteboard'
                        title = 'Close whiteboard'
                        type = 'button'>
                        ×
                    </button>
                )}
                <ExcalidrawApp
                    collabDetails = { collabDetails }
                    collabServerUrl = { collabServerUrl }
                    detectScroll = { true }
                    excalidraw = {{
                        isCollaborating: true,
                        langCode: i18next.language,

                        // @ts-ignore
                        ref: excalidrawRef,
                        theme: 'light',
                        UIOptions: WHITEBOARD_UI_OPTIONS
                    }}
                    getCollabAPI = { getCollabAPI }
                    getExcalidrawAPI = { getExcalidrawAPI } />
            </div>

            
        </div>
    );
};

export default WhiteboardWrapper;