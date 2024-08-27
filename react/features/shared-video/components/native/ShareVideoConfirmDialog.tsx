import React from 'react';
import { useTranslation } from 'react-i18next';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { DialogProps } from '../../../base/dialog/constants';

interface IProps extends DialogProps {

    /**
     * The name of the remote participant that shared the video.
     */
    actorName: string;

    /**
     * The function to execute when confirmed.
     */
    onSubmit: () => void;
}

/**
 * Dialog to confirm playing a video shared from a remote participant.
 *
 * @returns {JSX.Element}
 */
export default function ShareVideoConfirmDialog({ actorName, onSubmit }: IProps): JSX.Element {
    const { t } = useTranslation();

    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'dialog.Ok'
            descriptionKey = 'dialog.shareVideoConfirmPlay'
            onSubmit = { onSubmit }
            title = { t('dialog.shareVideoConfirmPlayTitle', {
                name: actorName
            }) } />
    );
}
