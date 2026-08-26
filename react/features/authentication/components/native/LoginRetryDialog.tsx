import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { cancelLogin, login } from '../../actions.native';

/**
 * Dialog shown when the app returns to the foreground while an external token
 * authentication (started by opening {@code tokenAuthUrl} in the system
 * browser) was not completed. It warns the user that they are not connected
 * to the meeting and offers to either retry the login or leave.
 *
 * @returns {JSX.Element}
 */
export default function LoginRetryDialog(): JSX.Element {
    const dispatch = useDispatch();
    const handleSubmit = useCallback(() => {
        dispatch(login());

        return true; // close dialog
    }, [ dispatch ]);
    const handleCancel = useCallback(() => {
        dispatch(cancelLogin());

        return true; // close dialog
    }, [ dispatch ]);

    return (
        <ConfirmDialog
            cancelLabel = 'toolbar.leaveConference'
            confirmLabel = 'dialog.login'
            descriptionKey = 'dialog.loginNotCompleted'
            onCancel = { handleCancel }
            onSubmit = { handleSubmit } />
    );
}
