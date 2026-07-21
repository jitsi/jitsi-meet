import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { MEDIA_TYPE } from '../../base/media/constants';
import { isLocalTrackMuted } from '../../base/tracks/functions.any';
import { useDocumentPiPMediaSession } from '../hooks';

/**
 * Inner component for the Document PiP.
 *
 * @returns {React.ReactElement}
 */
export function DocumentPiPContent() {
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
