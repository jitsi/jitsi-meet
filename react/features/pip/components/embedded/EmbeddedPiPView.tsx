import React, { RefObject } from 'react';

import StatelessAvatar from '../../../base/avatar/components/web/StatelessAvatar';
import { DEFAULT_ICON } from '../../../base/icons/svg/constants';
import { IEmbeddedDocumentPiPViewModel } from '../../embeddedDocumentPiP';

import EmbeddedPiPControls from './EmbeddedPiPControls';

interface IProps {
    hasPlayableVideo: boolean;
    onAudioClick: () => void;
    onHangupClick: () => void;
    onVideoClick: () => void;
    onVideoLoadedData: () => void;
    onVideoPlaying: () => void;
    state: Partial<IEmbeddedDocumentPiPViewModel>;
    videoRef: RefObject<HTMLVideoElement>;
}

/**
 * Complete presentation for the isolated embedded Document PiP renderer.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
const EmbeddedPiPView = ({
    hasPlayableVideo,
    onAudioClick,
    onHangupClick,
    onVideoClick,
    onVideoLoadedData,
    onVideoPlaying,
    state,
    videoRef
}: IProps) => {
    const showAvatar = Boolean(state.videoMuted || !state.videoAvailable || !hasPlayableVideo);

    return (
        <div className = 'doc-pip-container embedded-doc-pip'>
            <div className = 'doc-pip-video-area'>
                <div className = 'doc-pip-videos-container'>
                    <div className = 'doc-pip-compact-layout'>
                        <video
                            autoPlay = { true }
                            className = 'doc-pip-video-element'
                            hidden = { showAvatar }
                            muted = { true }
                            onLoadedData = { onVideoLoadedData }
                            onPlaying = { onVideoPlaying }
                            playsInline = { true }
                            ref = { videoRef } />
                        {showAvatar && <div className = 'doc-pip-avatar-placeholder'>
                            <StatelessAvatar
                                color = { state.avatar?.color }
                                iconUser = { DEFAULT_ICON.IconUser }
                                initials = { state.avatar?.initials }
                                size = { 120 }
                                url = { state.avatar?.url }
                                useCORS = { state.avatar?.useCORS } />
                        </div>}
                        <div className = 'doc-pip-participant-name'>{state.displayName || ''}</div>
                    </div>
                </div>
                <div className = 'doc-pip-controls'>
                    {state.controls && <EmbeddedPiPControls
                        onAudioClick = { onAudioClick }
                        onHangupClick = { onHangupClick }
                        onVideoClick = { onVideoClick }
                        viewModel = { state.controls } />}
                </div>
            </div>
        </div>
    );
};

export default EmbeddedPiPView;
