import { ExcalidrawApp } from '@jitsi/excalidraw';
import i18next from 'i18next';
import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import '@jitsi/excalidraw/index.css';

import { IReduxState } from '../../../app/types';
import { WHITEBOARD_UI_OPTIONS } from '../../constants';
import { getStorageBackendUrl } from '../../functions';

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
    const excalidrawAPIRef = useRef<any>(null);
    const collabAPIRef = useRef<any>(null);
    const storageBackendUrl = useSelector(getStorageBackendUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt']).jwt || '';

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
                <ExcalidrawApp
                    collabDetails = { collabDetails }
                    collabServerUrl = { collabServerUrl }
                    excalidraw = {{
                        isCollaborating: true,
                        langCode: i18next.language,
                        theme: 'light',
                        UIOptions: WHITEBOARD_UI_OPTIONS
                    }}
                    getCollabAPI = { getCollabAPI }
                    getExcalidrawAPI = { getExcalidrawAPI }
                    jwt = { jwt }
                    storageBackendUrl = { storageBackendUrl } />
            </div>


        </div>
    );
};

export default WhiteboardWrapper;
