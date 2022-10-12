import React from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of {@link LogoutDialog}'s React {@code Component} props.
 */
interface Props extends WithTranslation {

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
function LogoutDialog({ onLogout, t }: Props) {
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
