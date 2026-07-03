import React from 'react';

import HangupButton from '../../toolbox/components/HangupButton';
import AudioMuteButton from '../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../toolbox/components/web/VideoMuteButton';
import CompactLayout from './layouts/CompactLayout';

/**
 * Root component for Document PiP content.
 * Renders the appropriate layout based on Redux state.
 *
 * @returns {React.ReactElement} The Document PiP view element.
 */
const DocumentPiPView: React.FC = () => {

    const renderLayout = () => {
        // TODO: add switch case for adding more layouts in future
        return <CompactLayout />;
    };

    return (
        <div className = 'doc-pip-container'>
            <div className = 'doc-pip-video-area'>
                <div className = 'doc-pip-videos-container'>
                    {renderLayout()}
                </div>
                <div className = 'doc-pip-controls'>
                    <AudioMuteButton />
                    <VideoMuteButton />
                    <HangupButton customClass = 'hangup-button' />
                </div>
            </div>
        </div>
    );
};

export default DocumentPiPView;
