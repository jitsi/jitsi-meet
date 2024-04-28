import React from 'react';
import { useTranslation } from 'react-i18next';

import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of {@link LoginQuestionDialog}'s React {@code Component} props.
 */
interface IProps {

    /**
     * The handler.
     */
    handler: () => void;
}

/**
 * Implements the dialog that warns the user that the login will leave the conference.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
const LoginQuestionDialog = ({ handler }: IProps) => {
    const { t } = useTranslation();

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.Yes' }}
            onSubmit = { handler }
            titleKey = { t('dialog.login') }>
            <div>
                { t('dialog.loginQuestion') }
            </div>
        </Dialog>
    );
};

export default LoginQuestionDialog;
