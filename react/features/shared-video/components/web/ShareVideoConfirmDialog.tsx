import React from 'react';
import { useTranslation } from 'react-i18next';

import { DialogProps } from '../../../base/dialog/constants';
import Dialog from '../../../base/ui/components/web/Dialog';

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
        <Dialog
            onSubmit = { onSubmit }
            title = { t('dialog.shareVideoConfirmPlayTitle', {
                name: actorName
            }) }>
            <div>
                { t('dialog.shareVideoConfirmPlay') }
            </div>
        </Dialog>
    );
}
