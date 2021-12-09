// @flow

import React from 'react';

import { Avatar } from '../../../base/avatar';
import { HIDDEN_EMAILS } from '../../../lobby/constants';

import NotificationButton from './NotificationButton';

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
     * Array of participants to be displayed.
     */
    participants: Array<Object>,

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
    testIdPrefix,
    rejectButtonText
}: Props): React$Element<'ul'> {
    return (
        <ul className = 'knocking-participants-container'>
            { participants.map(p => (
                <li
                    className = 'knocking-participant'
                    data-testid = { p.id }
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
                        id = 'unmute-button'
                        participant = { p }
                        testId = { `${testIdPrefix}.allow` }>
                        { approveButtonText }
                    </NotificationButton> }
                    { <NotificationButton
                        action = { onReject }
                        className = 'borderLess'
                        id = 'dismiss-button'
                        participant = { p }
                        testId = { `${testIdPrefix}.reject` }>
                        { rejectButtonText }
                    </NotificationButton>}
                </li>
            )) }
        </ul>);
}
