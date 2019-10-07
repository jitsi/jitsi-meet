/* @flow */

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import { AbstractChatPrivacyDialog, _mapDispatchToProps, _mapStateToProps } from '../AbstractChatPrivacyDialog';

/**
 * Implements a component for the dialog displayed to avoid mis-sending private messages.
 */
class ChatPrivacyDialog extends AbstractChatPrivacyDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                cancelKey = 'dialog.sendPrivateMessageCancel'
                okKey = 'dialog.sendPrivateMessageOk'
                onCancel = { this._onSendGroupMessage }
                onSubmit = { this._onSendPrivateMessage }
                titleKey = 'dialog.sendPrivateMessageTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.sendPrivateMessage') }
                </div>
            </Dialog>
        );
    }

    _onSendGroupMessage: () => boolean;

    _onSendPrivateMessage: () => boolean;
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatPrivacyDialog));
