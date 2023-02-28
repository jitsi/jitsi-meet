import { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { getLocalizedDateFormatter } from '../../base/i18n/dateUtil';
import { MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../constants';
import { IMessage } from '../reducer';

/**
 * Formatter string to display the message timestamp.
 */
const TIMESTAMP_FORMAT = 'H:mm';

/**
 * The type of the React {@code Component} props of {@code AbstractChatMessage}.
 */
export interface IProps extends WithTranslation {

    /**
     * Whether current participant is currently knocking in the lobby room.
     */
    knocking: boolean;

    /**
     * The representation of a chat message.
     */
    message: IMessage;

    /**
     * Whether or not the avatar image of the participant which sent the message
     * should be displayed.
     */
    showAvatar?: boolean;

    /**
     * Whether or not the name of the participant which sent the message should
     * be displayed.
     */
    showDisplayName: boolean;

    /**
     * Whether or not the time at which the message was sent should be
     * displayed.
     */
    showTimestamp: boolean;
}

/**
 * Abstract component to display a chat message.
 */
export default class AbstractChatMessage<P extends IProps> extends PureComponent<P> {
    /**
     * Returns the timestamp to display for the message.
     *
     * @returns {string}
     */
    _getFormattedTimestamp() {
        return getLocalizedDateFormatter(new Date(this.props.message.timestamp))
            .format(TIMESTAMP_FORMAT);
    }

    /**
     * Generates the message text to be rendered in the component.
     *
     * @returns {string}
     */
    _getMessageText() {
        const { message } = this.props;

        return message.messageType === MESSAGE_TYPE_ERROR
            ? this.props.t('chat.error', {
                error: message.message
            })
            : message.message;
    }

    /**
     * Returns the message that is displayed as a notice for private messages.
     *
     * @returns {string}
     */
    _getPrivateNoticeMessage() {
        const { message, t } = this.props;

        return t('chat.privateNotice', {
            recipient: message.messageType === MESSAGE_TYPE_LOCAL ? message.recipient : t('chat.you')
        });
    }
}
