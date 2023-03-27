import React, { Component } from 'react';

import { IReduxState } from '../../app/types';
import { getParticipantById, hasRaisedHand } from '../../base/participants/functions';

export interface IProps {

    /**
     * True if the hand is raised for this participant.
     */
    _raisedHand?: boolean;

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string;
}

/**
 * Implements an abstract class for the RaisedHandIndicator component.
 */
export default class AbstractRaisedHandIndicator<P extends IProps>
    extends Component<P> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._raisedHand) {
            return null;
        }

        return this._renderIndicator();
    }

    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator: () => React.ReactElement;

}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {Object}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    const participant = getParticipantById(state, ownProps.participantId);

    return {
        _raisedHand: hasRaisedHand(participant)
    };
}
