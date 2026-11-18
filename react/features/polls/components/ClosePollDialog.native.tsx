import React from 'react';

import ConfirmDialog from '../../base/dialog/components/native/ConfirmDialog';
import { DialogProps } from '../../base/dialog/constants';

interface IProps extends DialogProps {

    /**
     * The function to execute when confirmed.
     */
    onSubmit: () => void;
}

/**
 * Dialog to confirm ending a poll for everyone.
 *
 * @returns {JSX.Element}
 */
export default function ClosePollDialog({ onSubmit }: IProps) {
    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'polls.results.endPoll'
            descriptionKey = 'polls.endPollDialog.description'
            isConfirmDestructive = { true }
            onSubmit = { onSubmit }
            title = 'polls.endPollDialog.title' />
    );
}
