import i18next from 'i18next';
import React, { useCallback, useEffect, useRef } from 'react';

import { WHITEBOARD_UI_OPTIONS } from '../../constants';
import { useExcalidrawApp } from '../../hooks/useExcalidraw';

/**
 * Whiteboard wrapper for mobile.
 *
 * @returns {JSX.Element}
 */
const WhiteboardWrapper = ({
    className,
    collabDetails,
    collabServerUrl,
    localParticipantName
}: {
    className?: string;
    collabDetails: {
        roomId: string;
        roomKey: string;
    };
    collabServerUrl: string;
    localParticipantName: string;
}) => {
    const excalidrawRef = useRef<any>(null);
    const excalidrawAPIRef = useRef<any>(null);
    const collabAPIRef = useRef<any>(null);

    const { ExcalidrawApp, isLoading, error, loadExcalidrawApp } = useExcalidrawApp();

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

    // Load ExcalidrawApp when component mounts
    useEffect(() => {
        if (!ExcalidrawApp && !isLoading && !error) {
            loadExcalidrawApp().catch(() => {
                // Error is handled by the hook
            });
        }
    }, [ ExcalidrawApp, isLoading, error, loadExcalidrawApp ]);

    return (
        <div className = { className }>
            <div className = 'excalidraw-wrapper'>
                {isLoading && (
                    <div className = 'whiteboard-loading'>
                        Loading whiteboard...
                    </div>
                )}
                {error && (
                    <div className = 'whiteboard-error'>
                        Failed to load whiteboard
                    </div>
                )}
                {ExcalidrawApp && (
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
                )}
            </div>


        </div>
    );
};

export default WhiteboardWrapper;
