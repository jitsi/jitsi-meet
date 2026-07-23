import React from 'react';

import ToolbarButton from '../../../always-on-top/ToolbarButton';
import IconHangup from '../../../base/icons/svg/hangup.svg';
import IconMicSlash from '../../../base/icons/svg/mic-slash.svg';
import IconMic from '../../../base/icons/svg/mic.svg';
import IconVideoOff from '../../../base/icons/svg/video-off.svg';
import IconVideo from '../../../base/icons/svg/video.svg';
import { IEmbeddedDocumentPiPControlsViewModel } from '../../embeddedDocumentPiP';

interface IProps {
    onAudioClick: () => void;
    onHangupClick: () => void;
    onVideoClick: () => void;
    viewModel: IEmbeddedDocumentPiPControlsViewModel;
}

/**
 * Controls for the isolated embedded Document PiP renderer.
 * State is a serialized projection of the meeting Redux store.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
const EmbeddedPiPControls = ({
    onAudioClick,
    onHangupClick,
    onVideoClick,
    viewModel
}: IProps) => {
    const {
        audioDisabled,
        audioMuted,
        audioPending,
        audioVisible,
        labels,
        videoDisabled,
        videoMuted,
        videoPending,
        videoVisible
    } = viewModel;
    const audioLabel = audioPending
        ? labels.pendingAudio
        : audioMuted ? labels.unmuteAudio : labels.muteAudio;
    const videoLabel = videoPending
        ? labels.pendingVideo
        : videoMuted ? labels.unmuteVideo : labels.muteVideo;

    return (
        <>
            {audioVisible && <ToolbarButton
                accessibilityLabel = { audioLabel }
                disabled = { audioDisabled || audioPending }
                icon = { audioMuted ? IconMicSlash : IconMic }
                onClick = { onAudioClick }
                toggled = { audioMuted } />}
            {videoVisible && <ToolbarButton
                accessibilityLabel = { videoLabel }
                disabled = { videoDisabled || videoPending }
                icon = { videoMuted ? IconVideoOff : IconVideo }
                onClick = { onVideoClick }
                toggled = { videoMuted } />}
            <ToolbarButton
                accessibilityLabel = { labels.hangup }
                customClass = 'hangup-button'
                icon = { IconHangup }
                onClick = { onHangupClick } />
        </>
    );
};

export default EmbeddedPiPControls;
