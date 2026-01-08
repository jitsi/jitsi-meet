import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { DialogProps } from '../../../base/dialog/constants';
import { demoteRequest } from '../../../visitors/actions';

interface IProps extends DialogProps {

    /**
     * The ID of the remote participant to be demoted.
     */
    participantID: string;
}

/**
 * Dialog to confirm a remote participant demote to visitor action.
 *
 * @returns {JSX.Element}
 */
export default function DemoteToVisitorDialog({ participantID }: IProps): JSX.Element {
    const dispatch = useDispatch();
    const handleSubmit = useCallback(() => {
        dispatch(demoteRequest(participantID));

        return true; // close dialog
    }, [ dispatch, participantID ]);

    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'dialog.confirm'
            descriptionKey = 'dialog.demoteParticipantDialog'
            isConfirmDestructive = { true }
            onSubmit = { handleSubmit }
            title = 'dialog.demoteParticipantTitle' />
    );
}
