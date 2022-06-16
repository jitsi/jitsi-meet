// @flow

import { Component } from 'react';

import { getParticipantById, hasRaisedHand } from '../../base/participants';

export type Props = {

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string,

    /**
     * True if the hand is raised for this participant.
     */
    _raisedHand?: boolean
}

/**
 * Implements an abstract class for the RaisedHandIndicator component.
 */
export default class AbstractRaisedHandIndicator<P: Props>
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
    _renderIndicator: () => React$Element<*>;

}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Object}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const participant = getParticipantById(state, ownProps.participantId);

    return {
        _raisedHand: hasRaisedHand(participant)
    };
}
