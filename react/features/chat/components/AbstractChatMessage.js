// @flow

import { PureComponent } from 'react';

import { getAvatarURLByParticipantId } from '../../base/participants';

/**
 * The type of the React {@code Component} props of {@code AbstractChatMessage}.
 */
export type Props = {

    /**
     * The URL of the avatar of the participant.
     */
    _avatarURL: string,

    /**
     * The representation of a chat message.
     */
    message: Object,

    /**
     * Invoked to receive translated strings.
     */
    t: Function
};

/**
 * Abstract component to display a chat message.
 */
export default class AbstractChatMessage<P: Props> extends PureComponent<P> {}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 *     _avatarURL: string
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { message } = ownProps;

    return {
        _avatarURL: getAvatarURLByParticipantId(state, message.user._id)
    };
}
