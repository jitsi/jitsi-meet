import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { CHAT_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconMessage, IconReply } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { arePollsDisabled } from '../../../conference/functions.any';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { handleLobbyChatInitialized, openChat } from '../../actions.native';

export interface IProps extends AbstractButtonProps {

    /**
     * True if message is a lobby chat message.
     */
    _isLobbyMessage: boolean;

    /**
     * True if the polls feature is disabled.
     */
    _isPollsDisabled?: boolean;

    /**
     * The participant object retrieved from Redux.
     */
    _participant?: IParticipant;

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantID: string;

    /**
     * True if the button is rendered as a reply button.
     */
    reply: boolean;
}

/**
 * Class to render a button that initiates the sending of a private message through chat.
 */
class PrivateMessageButton extends AbstractButton<IProps, any> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.privateMessage';
    override icon = IconMessage;
    override label = 'toolbar.privateMessage';
    override toggledIcon = IconReply;

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        if (this.props._isLobbyMessage) {
            this.props.dispatch(handleLobbyChatInitialized(this.props.participantID));
        }

        this.props.dispatch(openChat(this.props._participant));

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
    override _isToggled() {
        return this.props.reply;
    }

}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const enabled = getFeatureFlag(state, CHAT_ENABLED, true);
    const { visible = enabled, isLobbyMessage, participantID } = ownProps;

    return {
        _isPollsDisabled: arePollsDisabled(state),
        _participant: getParticipantById(state, participantID),
        _isLobbyMessage: isLobbyMessage,
        visible
    };
}

export default translate(connect(_mapStateToProps)(PrivateMessageButton));
