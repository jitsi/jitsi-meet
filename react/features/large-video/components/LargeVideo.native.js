/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ParticipantView } from '../../base/participants';

import styles from './styles';

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on mobile/React Native.
 *
 * @extends Component
 */
class LargeVideo extends Component {
    /**
     * LargeVideo component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The ID of the participant (to be) depicted by LargeVideo.
         *
         * @private
         */
        _participantId: React.PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ParticipantView
                avatarStyle = { styles.avatar }
                participantId = { this.props._participantId }
                style = { styles.largeVideo }
                zOrder = { 0 } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo's props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _participantId: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _participantId: state['features/large-video'].participantId
    };
}

export default connect(_mapStateToProps)(LargeVideo);
