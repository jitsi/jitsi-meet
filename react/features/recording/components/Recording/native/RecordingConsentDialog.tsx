import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Dialog from 'react-native-dialog';

import ConfirmDialog from '../../../../base/dialog/components/native/ConfirmDialog';
import Link from '../../../../base/react/components/native/Link';
import { setAudioMuted, setAudioUnmutePermissions, setVideoMuted, setVideoUnmutePermissions } from '../../../../base/media/actions';
import { IReduxState } from '../../../../app/types';
import styles from '../styles.native';

/**
 * Component that renders the dialog for explicit consent for recordings.
 *
 * @returns {JSX.Element}
 */
export default function RecordingConsentDialog() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { recordings } = useSelector((state: IReduxState) => state['features/base/config']);
    const { consentLearnMoreLink } = recordings ?? {};


    const consent = useCallback(() => {
        dispatch(setAudioUnmutePermissions(false, true));
        dispatch(setVideoUnmutePermissions(false, true));

        return true;
    }, []);

    const consentAndUnmute = useCallback(() => {
        dispatch(setAudioUnmutePermissions(false, true));
        dispatch(setVideoUnmutePermissions(false, true));
        dispatch(setAudioMuted(false));
        dispatch(setVideoMuted(false));

        return true;
    }, []);

    return (
        <ConfirmDialog
            backLabel = { 'dialog.UnderstandAndUnmute' }
            confirmLabel = { 'dialog.Understand' }
            isBackHidden = { false }
            isCancelHidden = { true }
            onBack = { consentAndUnmute }
            onSubmit = { consent }
            title = { 'dialog.recordingInProgressTitle' }
            verticalButtons = { true }>
            <Dialog.Description>
                {t('dialog.recordingInProgressDescriptionFirstHalf')}
                {consentLearnMoreLink && (
                    <Link
                        style = { styles.learnMoreLink }
                        url = { consentLearnMoreLink }>
                        {`(${t('dialog.learnMore')})`}
                    </Link>
                )}
                {t('dialog.recordingInProgressDescriptionSecondHalf')}
            </Dialog.Description>
        </ConfirmDialog>
    );
}
