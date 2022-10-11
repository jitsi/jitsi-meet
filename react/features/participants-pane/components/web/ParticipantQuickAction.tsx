import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { approveParticipant } from '../../../av-moderation/actions';
import Button from '../../../base/ui/components/web/Button';
import { QUICK_ACTION_BUTTON } from '../../constants';

type Props = {

    /**
     * The translated ask unmute aria label.
     */
    ariaLabel?: boolean;

    /**
     * The translated "ask unmute" text.
     */
    askUnmuteText: string;

    /**
     * The type of button to be displayed.
     */
    buttonType: string;

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function;

    /**
     * Label for mute participant button.
     */
    muteParticipantButtonText: string;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * The name of the participant.
     */
    participantName: string;
};

const useStyles = makeStyles()((theme: Theme) => {
    return {
        button: {
            marginRight: theme.spacing(2)
        }
    };
});

const ParticipantQuickAction = ({
    askUnmuteText,
    buttonType,
    muteAudio,
    muteParticipantButtonText,
    participantID,
    participantName
}: Props) => {
    const { classes: styles } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(participantID));
    }, [ dispatch, participantID ]);

    switch (buttonType) {
    case QUICK_ACTION_BUTTON.MUTE: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.mute')} ${participantName}` }
                className = { styles.button }
                label = { muteParticipantButtonText }
                onClick = { muteAudio(participantID) }
                size = 'small'
                testId = { `mute-${participantID}` } />
        );
    }
    case QUICK_ACTION_BUTTON.ASK_TO_UNMUTE: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.askUnmute')} ${participantName}` }
                className = { styles.button }
                label = { askUnmuteText }
                onClick = { askToUnmute }
                size = 'small'
                testId = { `unmute-${participantID}` } />
        );
    }
    default: {
        return null;
    }
    }
};

export default ParticipantQuickAction;
