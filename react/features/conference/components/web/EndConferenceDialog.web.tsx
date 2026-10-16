import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { endConference } from '../../../base/conference/actions';
import { getParticipantCount } from '../../../base/participants/functions';
import Dialog from '../../../base/ui/components/web/Dialog';

const useStyles = makeStyles()(theme => {
    return {
        description: {
            color: theme.palette.dialogText,
            marginBottom: theme.spacing(3)
        }
    };
});

/**
 * Dialog to confirm ending a conference for all participants.
 *
 * @returns {JSX.Element} - The end conference dialog component.
 */
export default function EndConferenceDialog(): JSX.Element {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const participantCount = useSelector(getParticipantCount);

    const onSubmit = useCallback(() => {
        dispatch(endConference());
    }, [ dispatch ]);

    const descriptionText = participantCount === 1
        ? t('dialog.endConferenceDialog_singular')
        : t('dialog.endConferenceDialog', { count: participantCount });

    return (
        <Dialog
            ok = {{
                translationKey: 'dialog.endConferenceButton'
            }}
            onSubmit = { onSubmit }
            size = 'small'
            titleKey = 'dialog.endConferenceTitle'>
            <div className = { classes.description }>
                { descriptionText }
            </div>
        </Dialog>
    );
}
