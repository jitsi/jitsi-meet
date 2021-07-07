// @flow

import React from 'react';

import NotificationWithParticipantItem from './NotificationWithParticipantItem';

type Props = {

    /**
     * Text used for button which triggeres `onApprove` action.
     */
    approveButtonText: string,

    /**
     * Callback used when clicking the ok/approve button.
     */
    onApprove: Function,

    /**
     * Callback used when clicking the reject button.
     */
    onReject: Function,

    /**
     * Array of participant IDs to be displayed.
     */
    participants: Array<string>,

    /**
     * The function to select participants by ID.
     */
    participantSelector: Function,

    /**
     * Text for button which triggeres the `reject` action.
     */
    rejectButtonText: string,


    /**
     * String prefix used for button `test-id`.
     */
     testIdPrefix: string
}

/**
 * Component used to display a list of notifications based on a list of participants.
 * This is visible only to moderators.
 *
 * @returns {React$Element<'div'> | null}
 */
export default function({
    approveButtonText,
    onApprove,
    onReject,
    participants,
    participantSelector,
    testIdPrefix,
    rejectButtonText
}: Props): React$Element<'ul'> {
    return (
        <ul className = 'knocking-participants-container'>
            { participants.map(id => (
                <NotificationWithParticipantItem
                    approveButtonText = { approveButtonText }
                    key = { id }
                    onApprove = { onApprove }
                    onReject = { onReject }
                    participantID = { id }
                    participantSelector = { participantSelector }
                    rejectButtonText = { rejectButtonText }
                    testIdPrefix = { testIdPrefix } />
            )) }
        </ul>);
}
