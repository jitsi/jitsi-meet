import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant } from '../../../base/participants/functions';
import { ILocalParticipant } from '../../../base/participants/types';

/**
 * The type of the React {@code Component} props of
 * {@link ProfileButtonAvatar}.
 */
interface IProps {

    /**
     * The redux representation of the local participant.
     */
    _localParticipant?: ILocalParticipant;

}

/**
 * A React {@code Component} for displaying a profile avatar as an
 * icon.
 *
 * @augments Component
 */
class ProfileButtonAvatar extends Component<IProps> {
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
                participantId = { _localParticipant?.id }
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
function _mapStateToProps(state: IReduxState) {
    return {
        _localParticipant: getLocalParticipant(state)
    };
}

export default connect(_mapStateToProps)(ProfileButtonAvatar);
