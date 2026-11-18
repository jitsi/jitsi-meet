import React from 'react';
import { useTranslation } from 'react-i18next';

import { DialogProps } from '../../base/dialog/constants';
import Dialog from '../../base/ui/components/web/Dialog';

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
    const { t } = useTranslation();

    return (
        <Dialog
            ok = {{ translationKey: 'polls.results.endPoll' }}
            onSubmit = { onSubmit }
            titleKey = 'polls.endPollDialog.title'>
            <div>
                { t('polls.endPollDialog.description') }
            </div>
        </Dialog>
    );
}
