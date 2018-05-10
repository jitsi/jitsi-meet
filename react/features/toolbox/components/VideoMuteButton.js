// @flow

import { connect } from 'react-redux';

import {
    VIDEO_MUTE,
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { translate } from '../../base/i18n';
import {
    MEDIA_TYPE,
    VIDEO_MUTISM_AUTHORITY,
    setVideoMuted
} from '../../base/media';
import { AbstractVideoMuteButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { isLocalTrackMuted } from '../../base/tracks';

type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @extends AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton<Props, *> {
    label = 'toolbar.videomute';
    tooltip = 'toolbar.videomute';

    /**
     * Indicates if this button should be disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._audioOnly;
    }

    /**
     * Indicates if video is currently muted ot nor.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.props._videoMuted;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @private
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) {
        sendAnalytics(createToolbarEvent(VIDEO_MUTE, { enable: videoMuted }));
        this.props.dispatch(
            setVideoMuted(
                videoMuted,
                VIDEO_MUTISM_AUTHORITY.USER,
                /* ensureTrack */ true));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { audioOnly } = state['features/base/conference'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO)
    };
}

export default translate(connect(_mapStateToProps)(VideoMuteButton));
