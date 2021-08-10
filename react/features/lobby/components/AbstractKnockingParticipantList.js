// @flow

import { PureComponent } from 'react';

import { isLocalParticipantModerator } from '../../base/participants';
import { setKnockingParticipantApproval } from '../actions';
import { getLobbyState } from '../functions';

export type Props = {

    /**
     * The list of participants.
     */
    _participants: Array<Object>,

    /**
     * True if the list should be rendered.
     */
    _visible: boolean,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract class to encapsulate the platform common code of the {@code KnockingParticipantList}.
 */
export default class AbstractKnockingParticipantList<P: Props = Props> extends PureComponent<P> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onRespondToParticipant = this._onRespondToParticipant.bind(this);
    }

    _onRespondToParticipant: (string, boolean) => Function;

    /**
     * Function that constructs a callback for the response handler button.
     *
     * @param {string} id - The id of the knocking participant.
     * @param {boolean} approve - The response for the knocking.
     * @returns {Function}
     */
    _onRespondToParticipant(id, approve) {
        return () => {
            this.props.dispatch(setKnockingParticipantApproval(id, approve));
        };
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function mapStateToProps(state: Object): $Shape<Props> {
    const { knockingParticipants, lobbyEnabled } = getLobbyState(state);

    return {
        _participants: knockingParticipants,
        _visible: lobbyEnabled && isLocalParticipantModerator(state)
          && Boolean(knockingParticipants && knockingParticipants.length)
    };
}
