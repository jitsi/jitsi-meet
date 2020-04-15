// @flow

import { PureComponent } from 'react';

import { isLocalParticipantModerator } from '../../base/participants';
import { isToolboxVisible } from '../../toolbox';
import { setKnockingParticipantApproval } from '../actions';

type Props = {

    /**
     * The list of participants.
     */
    _participants: Array<Object>,

    /**
     * True if the toolbox is visible, so we need to adjust the position.
     */
    _toolboxVisible: boolean,

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
export default class AbstractKnockingParticipantList extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
    const _participants = state['features/lobby'].knockingParticipants;

    return {
        _participants,
        _toolboxVisible: isToolboxVisible(state),
        _visible: isLocalParticipantModerator(state) && Boolean(_participants?.length)
    };
}
