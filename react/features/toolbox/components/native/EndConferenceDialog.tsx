import React from 'react';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';


/**
 * The type of {@link EndConferenceDialog}'s React {@code Component} props.
 */
interface IProps {

    confirm: () => void;
}

/**
 * Component that renders the end of conference dialog.
 *
 * @param {Object} props - The props of the component.
 * @returns {JSX.Element}
 */
const EndConferenceDialog = ({ confirm }: IProps) => (
    <ConfirmDialog
        cancelLabel = { 'toolbar.endConferenceCancel' }
        confirmLabel = { 'toolbar.endConferenceConfirm' }
        isConfirmDestructive = { true }
        onSubmit = { confirm }
        title = { 'toolbar.endConferenceConfirmTitle' } />
);

export default EndConferenceDialog;
