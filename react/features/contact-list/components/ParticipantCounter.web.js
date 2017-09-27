import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getParticipantCount } from '../../base/participants';

/**
 * React component for showing a badge with the current count of conference
 * participants.
 *
 * @extends Component
 */
class ParticipantCounter extends Component {
    /**
     * {@code ParticipantCounter} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The number of participants in the conference.
         */
        _count: PropTypes.number
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <span className = 'badge-round'>
                <span id = 'numberOfParticipants'>
                    { this.props._count }
                </span>
            </span>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code ParticipantCounter}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _count: number
 * }}
 */
function _mapStateToProps(state) {
    return {
        _count: getParticipantCount(state)
    };
}

export default connect(_mapStateToProps)(ParticipantCounter);
