// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractWaitForOwnerDialog,
{ type Props as AbstractProps } from '../AbstractWaitForOwnerDialog';

type Props = AbstractProps & {

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: { key: string, params: Object},
}

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends AbstractWaitForOwnerDialog<Props, *> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            t,
            room,
            contentKey
        } = this.props;
        const content = t(
            contentKey.key = 'dialog.WaitForHostMsg',
            contentKey.params = { room }
        );

        return (
            <Dialog
                hideCancelButton = { false }
                okDisabled = { false }
                okKey = { t('dialog.IamHost') }
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin }
                width = { 'small' }>
                <span>
                    { content }
                </span>
            </Dialog>
        );
    }
}

export default translate(connect()(WaitForOwnerDialog));
