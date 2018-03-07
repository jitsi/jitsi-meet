// @flow

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { MEDIA_TYPE } from '../../../base/media';
import { isLocalTrackMuted } from '../../../base/tracks';

import AbstractAudioMuteButton from './AbstractAudioMuteButton';
import ToolbarButton from '../ToolbarButton';

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @extends AbstractAudioMuteButton
 */
export class AudioMuteButton extends AbstractAudioMuteButton {
    /**
     * {@code AbstractAudioMuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractAudioMuteButton.propTypes,

        /**
         * Styles to be applied to the button and the icon to show.
         */
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
