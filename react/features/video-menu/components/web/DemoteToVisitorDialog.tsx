import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { DialogProps } from '../../../base/dialog/constants';
import Dialog from '../../../base/ui/components/web/Dialog';
import { demoteRequest } from '../../../visitors/actions';

interface IProps extends DialogProps {

    /**
     * The ID of the remote participant to be demoted.
     */
    participantID: string;
}

/**
 * Dialog to confirm a remote participant demote action.
 *
 * @returns {JSX.Element}
 */
export default function DemoteToVisitorDialog({ participantID }: IProps): JSX.Element {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const handleSubmit = useCallback(() => {
        dispatch(demoteRequest(participantID));
    }, [ dispatch, participantID ]);

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.confirm' }}
            onSubmit = { handleSubmit }
            titleKey = 'dialog.demoteParticipantTitle'>
            <div>
                { t('dialog.demoteParticipantDialog') }
            </div>
        </Dialog>
    );
}
