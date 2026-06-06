import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
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
    override render() {
        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.sendPrivateMessageCancel' }}
                ok = {{ translationKey: 'dialog.sendPrivateMessageOk' }}
                onCancel = { this._onSendGroupMessage }
                onSubmit = { this._onSendPrivateMessage }
                titleKey = 'dialog.sendPrivateMessageTitle'>
                <div>
                    { this.props.t('dialog.sendPrivateMessage') }
                </div>
            </Dialog>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatPrivacyDialog));
