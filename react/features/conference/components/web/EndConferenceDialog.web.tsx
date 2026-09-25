import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { endConference } from '../../../base/conference/actions';
import { getParticipantCount } from '../../../base/participants/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';

const useStyles = makeStyles()(theme => {
    return {
        description: {
            color: theme.palette.dialogText,
            marginBottom: theme.spacing(3)
        },

        prompt: {
            color: theme.palette.dialogText,
            marginBottom: theme.spacing(1)
        },

        typedInput: {
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(2)
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
    const requireTypedConfirmation = useSelector((state: IReduxState) =>
        Boolean(state['features/base/config']?.requireTypedConfirmationForEndMeeting));

    const [ confirmationInput, setConfirmationInput ] = useState('');
    const expectedConfirmationText = t('dialog.endConferenceConfirmationText');

    const okDisabled = requireTypedConfirmation
        && confirmationInput.trim().toLowerCase() !== expectedConfirmationText.trim().toLowerCase();

    const onSubmit = useCallback(() => {
        dispatch(endConference());
    }, [ dispatch ]);

    const onInputChange = useCallback((value: string) => {
        setConfirmationInput(value);
    }, []);

    const descriptionText = participantCount === 1
        ? t('dialog.endConferenceDialog_singular')
        : t('dialog.endConferenceDialog', { count: participantCount });

    return (
        <Dialog
            ok = {{
                disabled: okDisabled,
                translationKey: 'dialog.endConferenceButton'
            }}
            onSubmit = { onSubmit }
            size = 'small'
            titleKey = 'dialog.endConferenceTitle'>
            <div className = { classes.description }>
                { descriptionText }
            </div>
            { requireTypedConfirmation && (
                <div className = { classes.typedInput }>
                    <div className = { classes.prompt }>
                        { t('dialog.endConferenceTypePrompt', { confirmationText: expectedConfirmationText }) }
                    </div>
                    <Input
                        autoFocus = { true }
                        id = 'end-conference-confirmation-input'
                        name = 'endConferenceConfirmation'
                        onChange = { onInputChange }
                        placeholder = { expectedConfirmationText }
                        type = 'text'
                        value = { confirmationInput } />
                </div>
            ) }
        </Dialog>
    );
}
