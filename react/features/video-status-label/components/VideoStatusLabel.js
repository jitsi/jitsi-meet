import React, { Component } from 'react';
import { connect } from 'react-redux';

import AudioOnlyLabel from './AudioOnlyLabel';
import HDVideoLabel from './HDVideoLabel';

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * will display when the conference is in audio only mode. {@code HDVideoLabel}
 * will display if not in audio only mode and a high-definition large video is
 * being displayed.
 */
export class VideoStatusLabel extends Component {
    /**
     * {@code VideoStatusLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is in audio only mode.
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * Whether or not a high-definition large video is displayed.
         */
        _largeVideoHD: React.PropTypes.bool
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        if (this.props._audioOnly) {
            return <AudioOnlyLabel />;
        } else if (this.props._largeVideoHD) {
            return <HDVideoLabel />;
        }

        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoStatusLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _largeVideoHD: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { audioOnly, isLargeVideoHD } = state['features/base/conference'];

    return {
        _audioOnly: audioOnly,
        _largeVideoHD: isLargeVideoHD
    };
}

export default connect(_mapStateToProps)(VideoStatusLabel);
