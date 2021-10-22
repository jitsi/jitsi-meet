// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../../av-moderation/actions';
import QuickActionButton from '../../../base/components/buttons/QuickActionButton';
import { QUICK_ACTION_BUTTON } from '../../constants';

type Props = {

    /**
     * The translated ask unmute aria label.
     */
    ariaLabel?: boolean,

    /**
     * The translated "ask unmute" text.
     */
    askUnmuteText: string,

    /**
     * The type of button to be displayed.
     */
    buttonType: string,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Label for mute participant button.
     */
    muteParticipantButtonText: string,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * The name of the participant.
     */
    participantName: string
}

const useStyles = makeStyles(theme => {
    return {
        button: {
            marginRight: `${theme.spacing(2)}px`
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
    const styles = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(participantID));
    }, [ dispatch, participantID ]);

    switch (buttonType) {
    case QUICK_ACTION_BUTTON.MUTE: {
        return (
            <QuickActionButton
                accessibilityLabel = { `${t('participantsPane.actions.mute')} ${participantName}` }
                className = { styles.button }
                onClick = { muteAudio(participantID) }
                testId = { `mute-${participantID}` }>
                {muteParticipantButtonText}
            </QuickActionButton>
        );
    }
    case QUICK_ACTION_BUTTON.ASK_TO_UNMUTE: {
        return (
            <QuickActionButton
                accessibilityLabel = { `${t('participantsPane.actions.askUnmute')} ${participantName}` }
                className = { styles.button }
                onClick = { askToUnmute }
                testId = { `unmute-${participantID}` }>
                { askUnmuteText }
            </QuickActionButton>
        );
    }
    default: {
        return null;
    }
    }
};

export default ParticipantQuickAction;
