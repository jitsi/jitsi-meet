import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { CHAT_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconChatUnread, IconMessage } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { arePollsDisabled } from '../../../conference/functions.any';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { getUnreadPollCount } from '../../../polls/functions';
import { getUnreadCount } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * True if the polls feature is disabled.
     */
    _isPollsDisabled?: boolean;

    /**
     * The unread message count.
     */
    _unreadMessageCount: number;
}

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class ChatButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.chat';
    icon = IconMessage;
    label = 'toolbar.chat';
    toggledIcon = IconChatUnread;

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props._isPollsDisabled
            ? navigate(screen.conference.chat)
            : navigate(screen.conference.chatandpolls.main);
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
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const enabled = getFeatureFlag(state, CHAT_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _isPollsDisabled: arePollsDisabled(state),

        // The toggled icon should also be available for new polls
        _unreadMessageCount: getUnreadCount(state) || getUnreadPollCount(state),
        visible
    };
}

export default translate(connect(_mapStateToProps)(ChatButton));
