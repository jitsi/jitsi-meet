import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { MEDIA_TYPE } from '../../base/media/constants';
import { isLocalTrackMuted } from '../../base/tracks/functions.any';
import { shouldShowPiP } from '../functions';
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
        <div id = 'document-pip-container' ref = {containerRef}>
            <div id = 'document-pip-player' ref = {playerRef}>
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

    // Document PiP must mount regardless of shouldShowPiP
    // because useDocumentPiPMediaSession registers the enterpictureinpicture
    // MediaSession handler needed for tab-switch auto-open.
    if ('documentPictureInPicture' in window) {
        return <DocumentPiPContent />;
    }

    if (!showPiP) {
        return null;
    }

    return <PiPVideoElement />;
}

export default PiP;
