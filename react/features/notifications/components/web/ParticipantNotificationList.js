// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '../../../base/avatar';
import { HIDDEN_EMAILS } from '../../../lobby/constants';

import NotificationButton from './NotificationButton';

type Props = {

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
export default function({ onApprove, onReject, participants, testIdPrefix }: Props): React$Element<'ul'> {
    const { t } = useTranslation();

    return (
        <ul className = 'knocking-participants-container'>
            { participants.map(p => (
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
                    <NotificationButton
                        action = { onApprove }
                        className = 'primary'
                        participant = { p }
                        testId = { `${testIdPrefix}.allow` }>
                        { t('lobby.allow') }
                    </NotificationButton>
                    <NotificationButton
                        action = { onReject }
                        className = 'borderLess'
                        participant = { p }
                        testId = { `${testIdPrefix}.reject` }>
                        { t('lobby.reject') }
                    </NotificationButton>
                </li>
            )) }
        </ul>);
}
