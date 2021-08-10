import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import NotificationWithParticipants from '../../notifications/components/web/NotificationWithParticipants';
import {
    approveParticipant,
    dismissPendingAudioParticipant
} from '../actions';
import { getParticipantsAskingToAudioUnmute } from '../functions';


/**
 * Component used to display a list of participants who asked to be unmuted.
 * This is visible only to moderators.
 *
 * @returns {React$Element<'ul'> | null}
 */
export default function() {
    const participants = useSelector(getParticipantsAskingToAudioUnmute);
    const { t } = useTranslation();

    return participants.length
        ? (
            <>
                <div className = 'title'>
                    { t('raisedHand') }
                </div>
                <NotificationWithParticipants
                    approveButtonText = { t('notify.unmute') }
                    onApprove = { approveParticipant }
                    onReject = { dismissPendingAudioParticipant }
                    participants = { participants }
                    rejectButtonText = { t('dialog.dismiss') }
                    testIdPrefix = 'avModeration' />
            </>
        ) : null;
}
