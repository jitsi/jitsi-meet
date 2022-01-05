// @flow

import React, { Component } from 'react';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of
 * {@link ProfileButtonAvatar}.
 */
type Props = {

    /**
     * The redux representation of the local participant.
     */
    _localParticipant: Object,

};

/**
 * A React {@code Component} for displaying a profile avatar as an
 * icon.
 *
 * @augments Component
 */
class ProfileButtonAvatar extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _localParticipant } = this.props;

        return (
            <Avatar
                participantId = { _localParticipant.id }
                size = { 20 } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code ProfileButtonAvatar} component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localParticipant: Object,
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localParticipant: getLocalParticipant(state)
    };
}

export default translate(connect(_mapStateToProps)(ProfileButtonAvatar));
