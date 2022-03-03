// @flow

import { CHAT_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconMessage, IconReply } from '../../../base/icons';
import { getParticipantById } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { handleLobbyChatInitialized } from '../../../chat/actions.any';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

export type Props = AbstractButtonProps & {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantID: string,

    /**
     * True if the button is rendered as a reply button.
     */
    reply: boolean,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function,

    /**
     * True if the polls feature is disabled.
     */
    _isPollsDisabled: boolean,

    /**
     * True if message is a lobby chat message.
     */
    _isLobbyMessage: boolean,

    /**
     * The participant object retrieved from Redux.
     */
    _participant: Object,
};

/**
 * Class to render a button that initiates the sending of a private message through chet.
 */
class PrivateMessageButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.privateMessage';
    icon = IconMessage;
    label = 'toolbar.privateMessage';
    toggledIcon = IconReply;

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        if (this.props._isLobbyMessage) {
            this.props.dispatch(handleLobbyChatInitialized(this.props.participantID));
        }
        this.props._isPollsDisabled
            ? navigate(screen.conference.chat, {
                privateMessageRecipient: this.props._participant
            })
            : navigate(screen.conference.chatandpolls.main, {
                screen: screen.conference.chatandpolls.tab.chat,
                params: {
                    privateMessageRecipient: this.props._participant
                }
            });
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if this button is toggled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.reply;
    }

}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
    const enabled = getFeatureFlag(state, CHAT_ENABLED, true);
    const { disablePolls } = state['features/base/config'];
    const { visible = enabled, isLobbyMessage } = ownProps;

    return {
        _isPollsDisabled: disablePolls,
        _participant: getParticipantById(state, ownProps.participantID),
        _isLobbyMessage: isLobbyMessage,
        visible
    };
}

export default translate(connect(_mapStateToProps)(PrivateMessageButton));
