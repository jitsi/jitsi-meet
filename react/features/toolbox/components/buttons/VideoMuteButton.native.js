// @flow

import React from 'react';
import { connect } from 'react-redux';

import { MEDIA_TYPE } from '../../../base/media';
import { isLocalTrackMuted } from '../../../base/tracks';

import AbstractVideoMuteButton from './AbstractVideoMuteButton';
import type {
    Props as AbstractVideoMuteButtonProps
} from './AbstractVideoMuteButton';
import ToolbarButton from '../ToolbarButton';

/**
 * The type of the React {@link Component} props of {@link VideoMuteButton}.
 */
type Props = AbstractVideoMuteButtonProps & {

    /**
     * Whether or not the local participant is current in audio only mode. Video
     * mute toggling is disabled in audio only mode.
     */
    _audioOnly: boolean,

    /**
     * Styles to be applied to the button and the icon to show.
     */
    buttonStyles: Object
};

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @extends AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _audioOnly, buttonStyles } = this.props;

        return (
            <ToolbarButton
                disabled = { _audioOnly }
                iconName = { buttonStyles.iconName }
                iconStyle = { buttonStyles.iconStyle }
                onClick = { this._onToolbarToggleVideo }
                style = { buttonStyles.style } />
        );
    }

    _onToolbarToggleVideo: () => void;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state) {
    const conference = state['features/base/conference'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(conference.audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO)
    };
}

export default connect(_mapStateToProps)(VideoMuteButton);
