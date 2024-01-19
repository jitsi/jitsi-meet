import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of {@link LogoutDialog}'s React {@code Component} props.
 */
interface IProps extends WithTranslation {

    /**
     * Logout handler.
     */
    onLogout: () => void;
}

/**
 * Implements the Logout dialog.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}.
 */
function LogoutDialog({ onLogout, t }: IProps) {
    return (
        <Dialog
            ok = {{ translationKey: 'dialog.Yes' }}
            onSubmit = { onLogout }
            titleKey = { t('dialog.logoutTitle') }>
            <div>
                { t('dialog.logoutQuestion') }
            </div>
        </Dialog>
    );
}

export default translate(connect()(LogoutDialog));
