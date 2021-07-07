// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { getParticipantById } from '../../../base/participants';
import { HIDDEN_EMAILS } from '../../../lobby/constants';

import NotificationButton from './NotificationButton';

type Props = {

    /**
     * Text used for button which triggers `onApprove` action.
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
     * The participant id to be displayed.
     */
    participantID: string,

    /**
     * The function to select participants by ID.
     */
    participantSelector: Function,

    /**
     * Text for button which triggers the `reject` action.
     */
    rejectButtonText: string,


    /**
     * String prefix used for button `test-id`.
     */
     testIdPrefix: string
}

/**
 * Component used to display a participant item in the list of notifications.
 * This is visible only to moderators.
 *
 * @returns {React$Element<'div'> | null}
 */
export default function({
    approveButtonText,
    onApprove,
    onReject,
    participantID,
    participantSelector,
    testIdPrefix,
    rejectButtonText
}: Props): React$Element<'li'> {
    const p = useSelector(participantSelector(participantID));

    return (
        <li
            className = 'knocking-participant'
            key = { p.id }>
            <Avatar
                displayName = { p.name }
                size = { 48 }
                testId = { `${testIdPrefix}.avatar` }
                url = { p.loadableAvatarUrl } />

            <div className = 'details'>
                <span data-testid = { `${testIdPrefix}.name` }>
                    { p.name }
                </span>
                { p.email && !HIDDEN_EMAILS.includes(p.email) && (
                    <span data-testid = { `${testIdPrefix}.email` }>
                        { p.email }
                    </span>
                ) }
            </div>
            { <NotificationButton
                action = { onApprove }
                className = 'primary'
                participant = { p }
                testId = { `${testIdPrefix}.allow` }>
                { approveButtonText }
            </NotificationButton> }
            { <NotificationButton
                action = { onReject }
                className = 'borderLess'
                participant = { p }
                testId = { `${testIdPrefix}.reject` }>
                { rejectButtonText }
            </NotificationButton>}
        </li>);
}
