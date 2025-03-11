import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import ConfirmDialog from '../../../../base/dialog/components/native/ConfirmDialog';
import { setAudioUnmutePermissions, setVideoUnmutePermissions } from '../../../../base/media/actions';

/**
 * Component that renders the dialog for explicit consent for recordings.
 *
 * @returns {JSX.Element}
 */
export default function RecordingConsentDialog() {
    const dispatch = useDispatch();

    const consent = useCallback(() => {
        dispatch(setAudioUnmutePermissions(false, true));
        dispatch(setVideoUnmutePermissions(false, true));

        return true;
    }, []);

    return (
        <ConfirmDialog
            confirmLabel = { 'dialog.Understand' }
            descriptionKey = { 'dialog.recordingInProgressDescription' }
            isCancelHidden = { true }
            onSubmit = { consent }
            title = { 'dialog.recordingInProgressTitle' } />
    );
}
