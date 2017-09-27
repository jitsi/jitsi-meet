import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getParticipantById } from '../../base/participants';

/**
 * React {@code Component} for displaying the current presence status of a
 * participant.
 *
 * @extends Component
 */
class PresenceLabel extends Component {
    /**
     * The default values for {@code PresenceLabel} component's property types.
     *
     * @static
     */
    static defaultProps = {
        _presence: ''
    };

    /**
     * {@code PresenceLabel} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The current present status associated with the passed in
         * participantID prop.
         */
        _presence: PropTypes.string,

        /**
         * The ID of the participant whose presence status shoul display.
         */
        participantID: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _presence } = this.props;

        return (
            <div
                className
                    = { `presence-label ${_presence ? '' : 'no-presence'}` }>
                { _presence }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code PresenceLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The React Component props passed to the associated
 * instance of {@code PresenceLabel}.
 * @private
 * @returns {{
 *     _presence: (string|undefined)
 * }}
 */
function _mapStateToProps(state, ownProps) {
    const participant
        = getParticipantById(
            state['features/base/participants'], ownProps.participantID);

    return {
        _presence: participant && participant.presence
    };
}

export default connect(_mapStateToProps)(PresenceLabel);
