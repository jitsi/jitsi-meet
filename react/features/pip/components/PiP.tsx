import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { browser } from '../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../base/media/constants';
import { isLocalTrackMuted } from '../../base/tracks/functions.any';
import { isDocumentPiPSupported, shouldShowPiP } from '../functions';
import { useDocumentPiPMediaSession } from '../hooks';

import PiPVideoElement from './PiPVideoElement';

/**
 * Inner component for the Document PiP.
 *
 * @returns {React.ReactElement}
 */
function DocumentPiPContent() {
    const playerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioMuted = useSelector(
        (state: IReduxState) => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO));
    const videoMuted = useSelector(
        (state: IReduxState) => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO));

    useDocumentPiPMediaSession(playerRef, containerRef, !audioMuted, !videoMuted);

    return (
        <div id = 'document-pip-container'>
            <div id = 'document-pip-player'>
                {/* TODO: document pip contents */}
            </div>
        </div>
    );
}

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);

    if (!showPiP) {
        return null;
    }

    // Electron's Chromium also exposes documentPictureInPicture, this will help PiPVideoElement to be the always PiP choice for Electron. 
    if (browser.isElectron()) {
        return <PiPVideoElement />;
    }

    if (isDocumentPiPSupported()) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
