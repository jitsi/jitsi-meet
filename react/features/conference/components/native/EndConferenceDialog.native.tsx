import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { endConference } from '../../../base/conference/actions';
import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { getParticipantCount } from '../../../base/participants/functions';

/**
 * Dialog to confirm ending a conference for all participants on native platforms.
 *
 * @returns {JSX.Element} - The end conference dialog component.
 */
export default function EndConferenceDialog(): JSX.Element {
    const dispatch = useDispatch();
    const participantCount = useSelector(getParticipantCount);

    const onSubmit = useCallback(() => {
        dispatch(endConference());

        return true;
    }, [ dispatch ]);

    const descriptionKey = participantCount === 1
        ? 'dialog.endConferenceDialog_singular'
        : {
            key: 'dialog.endConferenceDialog',
            params: { count: participantCount } as any
        };

    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'dialog.endConferenceButton'
            descriptionKey = { descriptionKey }
            isConfirmDestructive = { true }
            onSubmit = { onSubmit }
            title = 'dialog.endConferenceTitle' />
    );
}
