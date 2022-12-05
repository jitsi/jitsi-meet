import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
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
    render() {
        const { emoji } = this.props.sas;

        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.sendPrivateMessageCancel' }}
                ok = {{ translationKey: 'dialog.sendPrivateMessageOk' }}
                onCancel = { this._onSendGroupMessage }
                onSubmit = { this._onSendPrivateMessage }
                titleKey = 'dialog.sendPrivateMessageTitle'>
                <div>
                    { emoji }
                </div>
            </Dialog>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatPrivacyDialog));
