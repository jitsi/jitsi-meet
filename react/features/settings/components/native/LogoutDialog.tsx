import React from 'react';
import { WithTranslation } from 'react-i18next';

import ConfirmDialog
    from '../../../base/dialog/components/native/ConfirmDialog';

interface ILogoutDialogProps extends WithTranslation {
    onLogout: Function;
}


const LogoutDialog: React.FC<ILogoutDialogProps> = ({ onLogout }: ILogoutDialogProps) => (
    <ConfirmDialog
        cancelLabel = 'dialog.Cancel'
        confirmLabel = 'dialog.Yes'
        descriptionKey = 'dialog.logoutQuestion'
        onSubmit = { onLogout } />
);

export default LogoutDialog;

