// @flow

import { PureComponent } from 'react';

import { getParticipantDisplayName } from '../../base/participants';

import { setPrivateMessageRecipient } from '../actions';

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
     * The name of the message recipient, if any.
     */
    _privateMessageRecipient: ?string
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
    const { privateMessageRecipient } = state['features/chat'];

    return {
        _privateMessageRecipient:
            privateMessageRecipient ? getParticipantDisplayName(state, privateMessageRecipient.id) : undefined
    };
}
