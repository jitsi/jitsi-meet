import { WithTranslation } from 'react-i18next';

import { IStore } from '../app/types';

export interface IMessage {
    displayName: string;
    error?: Object;
    id: string;
    isReaction: boolean;
    lobbyChat: boolean;
    message: string;
    messageId: string;
    messageType: string;
    privateMessage: boolean;
    recipient: string;
    timestamp: number;
}

/**
 * The type of the React {@code Component} props of {@code AbstractChat}.
 */
export interface IProps extends WithTranslation {

    /**
     * All the chat messages in the conference.
     */
    _messages: IMessage[];

    /**
     * Number of unread chat messages.
     */
    _nbUnreadMessages: number;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}
