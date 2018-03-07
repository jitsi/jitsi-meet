// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { MEDIA_TYPE } from '../../../base/media';
import { isLocalTrackMuted } from '../../../base/tracks';

import ToolbarButton from '../ToolbarButton';

import AbstractAudioMuteButton from './AbstractAudioMuteButton';

declare var APP: Object;

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @extends AbstractAudioMuteButton
 */
export class AudioMuteButton extends AbstractAudioMuteButton {
    static propTypes = {
        buttonStyles: PropTypes.object
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { buttonStyles } = this.props;

        return (
            <ToolbarButton
                iconName = { buttonStyles.iconName }
                iconStyle = { buttonStyles.iconStyle }
                onClick = { this._onToolbarToggleAudio }
                style = { buttonStyles.style } />
        );
    }

    _onToolbarToggleAudio: () => void;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 * }}
 */
function _mapStateToProps(state) {
    const tracks = state['features/base/tracks'];

    return {
        _audioMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO)
    };
}


export default connect(_mapStateToProps)(AudioMuteButton);
