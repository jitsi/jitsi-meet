// @flow

import { CHAT_ENABLED, getFeatureFlag } from '../../../base/flags';
import { IconChat, IconChatUnread } from '../../../base/icons';
import { setActiveModalId } from '../../../base/modal';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox';
import { openDisplayNamePrompt } from '../../../display-name';
import { CHAT_VIEW_MODAL_ID } from '../../constants';
import { getUnreadCount } from '../../functions';

type Props = AbstractButtonProps & {

    /**
     * Function to display chat.
     *
     * @protected
     */
    _displayChat: Function,

    /**
     * Function to diaply the name prompt before displaying the chat
     * window, if the user has no display name set.
     */
    _displayNameInputDialog: Function,

    /**
     * Whether or not to block chat access with a nickname input form.
     */
    _showNamePrompt: boolean,

    /**
     * The unread message count.
     */
    _unreadMessageCount: number
};

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class ChatButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.chat';
    icon = IconChat;
    label = 'toolbar.chat';
    toggledIcon = IconChatUnread;

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        if (this.props._showNamePrompt) {
            this.props._displayNameInputDialog(() => {
                this.props._displayChat();
            });
        } else {
            this.props._displayChat();
        }
    }

    /**
     * Renders the button toggled when there are unread messages.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return Boolean(this.props._unreadMessageCount);
    }
}

/**
 * Maps redux actions to the props of the component.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _displayChat,
 *     _displayNameInputDialog
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function) {
    return {
        /**
         * Launches native invite dialog.
         *
         * @private
         * @returns {void}
         */
        _displayChat() {
            dispatch(setActiveModalId(CHAT_VIEW_MODAL_ID));
        },

        /**
         * Displays a display name prompt.
         *
         * @param {Function} onPostSubmit - The function to invoke after a
         * succesfulsetting of the display name.
         * @returns {void}
         */
        _displayNameInputDialog(onPostSubmit) {
            dispatch(openDisplayNamePrompt(onPostSubmit));
        }
    };
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const localParticipant = getLocalParticipant(state);
    const enabled = getFeatureFlag(state, CHAT_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _showNamePrompt: !localParticipant.name,
        _unreadMessageCount: getUnreadCount(state),
        visible
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ChatButton);
