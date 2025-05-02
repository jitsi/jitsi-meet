import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { batch, useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translateToHTML } from '../../../../base/i18n/functions';
import {
    setAudioMuted,
    setAudioUnmutePermissions,
    setVideoMuted,
    setVideoUnmutePermissions
} from '../../../../base/media/actions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { hideDialog } from '../../../../base/dialog/actions';

/**
 * Component that renders the dialog for explicit consent for recordings.
 *
 * @returns {JSX.Element}
 */
export default function RecordingConsentDialog() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { recordings } = useSelector((state: IReduxState) => state['features/base/config']);
    const { consentLearnMoreLink } = recordings ?? {};
    const learnMore = ` (<a href="${consentLearnMoreLink}" target="_blank" rel="noopener noreferrer">${t('dialog.learnMore')}</a>)`;

    const consent = useCallback(() => {
        batch(() => {
            dispatch(setAudioUnmutePermissions(false, true));
            dispatch(setVideoUnmutePermissions(false, true));
        });
    }, []);

    const consentAndUnmute = useCallback(() => {
        batch(() => {
            dispatch(setAudioUnmutePermissions(false, true));
            dispatch(setVideoUnmutePermissions(false, true));
            dispatch(setAudioMuted(false));
            dispatch(setVideoMuted(false));
            dispatch(hideDialog());
        });
    }, []);

    return (
        <Dialog
            back = {{
                hidden: false,
                onClick: consentAndUnmute,
                translationKey: 'dialog.UnderstandAndUnmute'
            }}
            cancel = {{ hidden: true }}
            disableBackdropClose = { true }
            disableEscape = { true }
            hideCloseButton = { true }
            ok = {{ translationKey: 'dialog.Understand' }}
            onSubmit = { consent }
            titleKey = 'dialog.recordingInProgressTitle'>
            { translateToHTML(t, 'dialog.recordingInProgressDescription', { learnMore }) }
        </Dialog>
    );
}
