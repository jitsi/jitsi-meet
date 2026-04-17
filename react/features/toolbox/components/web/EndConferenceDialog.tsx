import React from 'react';
import { useTranslation } from 'react-i18next';

import Dialog from '../../../base/ui/components/web/Dialog';


/**
 * The type of {@link EndConferenceDialog}'s React {@code Component} props.
 */
interface IProps {

    confirm: () => void;
}

/**
 * Implements the dialog to confirm end of conference
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
const EndConferenceDialog = ({ confirm }: IProps) => {

    const { t } = useTranslation();

    return (
        <Dialog
            cancel = {{ translationKey: t('toolbar.endConferenceCancel') }}
            hideCloseButton = { true }
            ok = {{ translationKey: t('toolbar.endConferenceConfirm') }}
            onSubmit = { confirm }
            titleKey = { t('toolbar.endConferenceConfirmTitle') } />
    );
};

export default EndConferenceDialog;
