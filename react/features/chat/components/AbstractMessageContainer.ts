import { Component } from 'react';

import { IMessage } from '../types';

export interface IProps {

    /**
     * The messages array to render.
     */
    messages: IMessage[];
}

/**
 * Abstract component to display a list of chat messages, grouped by sender.
 *
 * @augments PureComponent
 */
export default class AbstractMessageContainer<P extends IProps, S> extends Component<P, S> {
    static defaultProps = {
        messages: [] as IMessage[]
    };

    /**
     * Iterates over all the messages and creates nested arrays which hold
     * consecutive messages sent by the same participant.
     *
     * @private
     * @returns {Array<Array<Object>>}
     */
    _getMessagesGroupedBySender() {
        const messagesCount = this.props.messages.length;
        const groups: IMessage[][] = [];
        let currentGrouping: IMessage[] = [];
        let currentGroupParticipantId;

        for (let i = 0; i < messagesCount; i++) {
            const message = this.props.messages[i];

            if (message.participantId === currentGroupParticipantId) {
                currentGrouping.push(message);
            } else {
                currentGrouping.length && groups.push(currentGrouping);

                currentGrouping = [ message ];
                currentGroupParticipantId = message.participantId;
            }
        }

        currentGrouping.length && groups.push(currentGrouping);

        return groups;
    }
}
