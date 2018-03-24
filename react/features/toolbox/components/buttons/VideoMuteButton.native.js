// @flow

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { MEDIA_TYPE } from '../../../base/media';
import { isLocalTrackMuted } from '../../../base/tracks';

import ToolbarButton from '../ToolbarButton';

import AbstractVideoMuteButton from './AbstractVideoMuteButton';

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @extends AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton {
    static propTypes = {
        ...AbstractVideoMuteButton.propTypes,
        _audioOnly: PropTypes.bool,
        styles: PropTypes.object
    };

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

    /**
     * Flag showing whether audio is muted.
     *
     * @protected
     * @type {boolean}
     */
    return {
        /**
         * The indicator which determines whether the conference is in
         * audio-only mode.
         *
         * @protected
         * @type {boolean}
         */
        _audioOnly: Boolean(conference.audioOnly),

        /**
         * Flag showing whether video is muted.
         *
         * @protected
         * @type {boolean}
         */
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO)
    };
}

export default connect(_mapStateToProps)(VideoMuteButton);
