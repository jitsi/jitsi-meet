import React from 'react';

import AudioToggleButton from './AudioToggleButton';
import HangUpButton from './HangUpButton';
import VideoToggleButton from './VideoToggleButton';

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
            <AudioToggleButton />
            <VideoToggleButton />
            <HangUpButton />
        </div>
    );
};

export default PiPControls;
