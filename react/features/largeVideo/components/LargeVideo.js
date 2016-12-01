import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ParticipantView } from '../../conference';

import { styles } from './styles';

/**
 * Large video React component.
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
    }

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
 * @returns {{
 *     _participantId: string
 * }}
 */
function mapStateToProps(state) {
    return {
        _participantId: state['features/largeVideo'].participantId
    };
}

export default connect(mapStateToProps)(LargeVideo);
