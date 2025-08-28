import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translateToHTML } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { grantRecordingConsent, grantRecordingConsentAndUnmute } from '../../../actions.web';


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

    useEffect(() => {
        APP.API.notifyRecordingConsentDialogOpen(true);

        return () => {
            APP.API.notifyRecordingConsentDialogOpen(false);
        };
    }, []);

    const consent = useCallback(() => {
        dispatch(grantRecordingConsent());
    }, []);

    const consentAndUnmute = useCallback(() => {
        dispatch(grantRecordingConsentAndUnmute());
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
