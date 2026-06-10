import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconMic, IconMicSlash } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { isLocalTrackMuted } from '../../../base/tracks/functions.any';
import { muteLocal } from '../../../video-menu/actions.any';

/**
 * Audio toggle button for Document PiP controls.
 * Dispatches directly to Redux for state changes.
 */
const AudioToggleButton: React.FC = () => {
    const dispatch = useDispatch();

    const audioMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO)
    );

    const handleClick = useCallback(() => {
        dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO));
    }, [ dispatch, audioMuted ]);

    return (
        <button
            className = { `doc-pip-btn ${audioMuted ? 'muted' : ''}` }
            onClick = { handleClick }
            title = { audioMuted ? 'Unmute' : 'Mute' }
            type = 'button'>
            {audioMuted ? <IconMicSlash /> : <IconMic />}
        </button>
    );
};

export default AudioToggleButton;
