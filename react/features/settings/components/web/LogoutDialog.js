// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

/**
 * The type of {@link LogoutDialog}'s React {@code Component} props.
 */
type Props = {

    /**
     * Logout handler.
     */
    onLogout: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements the Logout dialog.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}.
 */
function LogoutDialog(props: Props) {
    const { onLogout, t } = props;

    return (
        <Dialog
            hideCancelButton = { false }
            okKey = { t('dialog.Yes') }
            onSubmit = { onLogout }
            titleKey = { t('dialog.logoutTitle') }
            width = { 'small' }>
            <div>
                { t('dialog.logoutQuestion') }
            </div>
        </Dialog>
    );
}

export default translate(connect()(LogoutDialog));
