// @flow

import { PureComponent } from 'react';

import { getParticipantDisplayName, isLocalParticipantModerator } from '../../base/participants';
import { setPrivateMessageRecipient } from '../actions';
import { setLobbyChatActiveState } from '../actions.any';

export type Props = {

    /**
     * Function used to translate i18n labels.
     */
    t: Function,

    /**
     * Function to remove the recipent setting of the chat window.
     */
    _onRemovePrivateMessageRecipient: Function,

     /**
     * Function to make the lobby message receipient inactive.
     */
    _onHideLobbyChatRecipient: Function,

    /**
     * The name of the message recipient, if any.
     */
     _privateMessageRecipient: ?string,

     /**
      * Is lobby messaging active.
      */
     _isLobbyChatActive: boolean,

     /**
      * The name of the lobby message recipient, if any.
      */
     _lobbyMessageRecipient: ?string,

     /**
      * Shows widget if it is necessary.
      */
     _visible: boolean;
};

/**
 * Abstract class for the {@code MessageRecipient} component.
 */
export default class AbstractMessageRecipient<P: Props> extends PureComponent<P> {

}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Props}
 */
export function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
    return {
        _onRemovePrivateMessageRecipient: () => {
            dispatch(setPrivateMessageRecipient());
        },
        _onHideLobbyChatRecipient: () => {
            dispatch(setLobbyChatActiveState(false));
        }
    };
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object): $Shape<Props> {
    const { privateMessageRecipient, lobbyMessageRecipient, isLobbyChatActive } = state['features/chat'];

    return {
        _privateMessageRecipient:
            privateMessageRecipient ? getParticipantDisplayName(state, privateMessageRecipient.id) : undefined,
        _isLobbyChatActive: isLobbyChatActive,
        _lobbyMessageRecipient:
                isLobbyChatActive && lobbyMessageRecipient ? lobbyMessageRecipient.name : undefined,
        _visible: isLobbyChatActive ? isLocalParticipantModerator(state) : true
    };
}
