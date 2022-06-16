// @flow

import { PureComponent } from 'react';

export type Props = {

    /**
     * The messages array to render.
     */
    messages: Array<Object>
}

/**
 * Abstract component to display a list of chat messages, grouped by sender.
 *
 * @augments PureComponent
 */
export default class AbstractMessageContainer<P: Props> extends PureComponent<P> {
    static defaultProps = {
        messages: []
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
        const groups = [];
        let currentGrouping = [];
        let currentGroupParticipantId;

        for (let i = 0; i < messagesCount; i++) {
            const message = this.props.messages[i];

            if (message.id === currentGroupParticipantId) {
                currentGrouping.push(message);
            } else {
                currentGrouping.length && groups.push(currentGrouping);

                currentGrouping = [ message ];
                currentGroupParticipantId = message.id;
            }
        }

        currentGrouping.length && groups.push(currentGrouping);

        return groups;
    }
}
