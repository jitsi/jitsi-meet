import { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../app/types';
import { getParticipantDisplayName, isLocalParticipantModerator } from '../../base/participants/functions';
import { setLobbyChatActiveState, setPrivateMessageRecipient } from '../actions.any';


export interface IProps extends WithTranslation {

    /**
      * Is lobby messaging active.
      */
    _isLobbyChatActive: boolean;

    /**
      * The name of the lobby message recipient, if any.
      */
    _lobbyMessageRecipient?: string;

    /**
     * Function to make the lobby message recipient inactive.
     */
    _onHideLobbyChatRecipient: () => void;

    /**
     * Function to remove the recipient setting of the chat window.
     */
    _onRemovePrivateMessageRecipient: () => void;

    /**
     * The name of the message recipient, if any.
     */
    _privateMessageRecipient?: string;

    /**
      * Shows widget if it is necessary.
      */
    _visible: boolean;
}

/**
 * Abstract class for the {@code MessageRecipient} component.
 */
export default class AbstractMessageRecipient<P extends IProps> extends PureComponent<P> {

}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {IProps}
 */
export function _mapDispatchToProps(dispatch: IStore['dispatch']) {
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
 * @param {any} _ownProps - Components' own props.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, _ownProps: any) {
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
