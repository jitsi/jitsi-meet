import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconVideo, IconVideoOff } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { isLocalTrackMuted } from '../../../base/tracks/functions.any';
import { handleToggleVideoMuted } from '../../../toolbox/actions.any';

/**
 * Video toggle button for Document PiP controls.
 */
const VideoToggleButton: React.FC = () => {
    const dispatch = useDispatch();

    const videoMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO)
    );

    const handleClick = useCallback(() => {
        dispatch(handleToggleVideoMuted(!videoMuted, true, true));
    }, [ dispatch, videoMuted ]);

    return (
        <button
            className = { `doc-pip-btn ${videoMuted ? 'muted' : ''}` }
            onClick = { handleClick }
            title = { videoMuted ? 'Turn on camera' : 'Turn off camera' }
            type = 'button'>
            {videoMuted ? <IconVideoOff /> : <IconVideo />}
        </button>
    );
};

export default VideoToggleButton;
