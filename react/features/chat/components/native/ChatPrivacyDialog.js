import React from 'react';
import { connect } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../../base/i18n/functions';
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
            <ConfirmDialog
                cancelLabel = 'dialog.sendPrivateMessageCancel'
                confirmLabel = 'dialog.sendPrivateMessageOk'
                descriptionKey = 'dialog.sendPrivateMessage'
                onCancel = { this._onSendGroupMessage }
                onSubmit = { this._onSendPrivateMessage } />
        );
    }

    _onSendGroupMessage: () => boolean;

    _onSendPrivateMessage: () => boolean;
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatPrivacyDialog));
