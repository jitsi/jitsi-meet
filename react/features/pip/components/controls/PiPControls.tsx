import React from 'react';

import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';
import HangupButton from '../../../toolbox/components/HangupButton';

/**
 * Container for Document PiP control buttons.
 * Includes audio toggle, video toggle, layout selector, and hangup button.
 *
 * @returns {React.ReactElement}
 */
const PiPControls: React.FC = () => {

    // TODO: layout selection

    return (
        <div className = 'doc-pip-controls'>
            <AudioMuteButton />
            <VideoMuteButton />
            <HangupButton />
        </div>
    );
};

export default PiPControls;
