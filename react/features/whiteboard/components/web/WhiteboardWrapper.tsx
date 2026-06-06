import i18next from 'i18next';
import React, { Suspense, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { WHITEBOARD_UI_OPTIONS } from '../../constants';
import { getStorageBackendUrl } from '../../functions';

const LazyExcalidrawApp = React.lazy(async () => {
    const [ { ExcalidrawApp } ] = await Promise.all([
        import(/* webpackChunkName: "excalidraw" */ '@jitsi/excalidraw'),
        import(/* webpackChunkName: "excalidraw" */ '@jitsi/excalidraw/index.css')
    ]);

    return { default: ExcalidrawApp };
});

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
                <Suspense fallback = { null }>
                    <LazyExcalidrawApp
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
                </Suspense>
            </div>
        </div>
    );
};

export default WhiteboardWrapper;
