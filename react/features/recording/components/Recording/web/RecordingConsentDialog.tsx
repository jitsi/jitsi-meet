import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { setAudioUnmutePermissions, setVideoUnmutePermissions } from '../../../../base/media/actions';
import Dialog from '../../../../base/ui/components/web/Dialog';

/**
 * Component that renders the dialog for explicit consent for recordings.
 *
 * @returns {JSX.Element}
 */
export default function RecordingConsentDialog() {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const consent = useCallback(() => {
        dispatch(setAudioUnmutePermissions(false, true));
        dispatch(setVideoUnmutePermissions(false, true));
    }, []);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            disableBackdropClose = { true }
            disableEscape = { true }
            hideCloseButton = { true }
            ok = {{ translationKey: 'dialog.Understand' }}
            onSubmit = { consent }
            titleKey = 'dialog.recordingInProgressTitle'>
            <div>
                {t('dialog.recordingInProgressDescription')}
            </div>
        </Dialog>
    );
}
