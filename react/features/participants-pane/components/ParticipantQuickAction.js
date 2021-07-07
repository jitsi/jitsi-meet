// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';

import { QUICK_ACTION_BUTTON } from '../constants';

import AskToUnmuteButton from './AskToUnmuteButton';
import { QuickActionButton } from './styled';

type Props = {

    /**
     * The type of button to be displayed.
     */
    buttonType: string,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * The ID of the participant.
     */
    participantID: string,
}

/**
 * Component used to display mute/ask to unmute button.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element<'button'>}
 */
export default function ParticipantQuickAction({ buttonType, muteAudio, participantID }: Props) {
    const { t } = useTranslation();

    switch (buttonType) {
    case QUICK_ACTION_BUTTON.MUTE: {
        return (
            <QuickActionButton
                onClick = { muteAudio(participantID) }
                primary = { true }>
                {t('dialog.muteParticipantButton')}
            </QuickActionButton>
        );
    }
    case QUICK_ACTION_BUTTON.ASK_TO_UNMUTE: {
        return <AskToUnmuteButton id = { participantID } />;
    }
    default: {
        return null;
    }
    }
}
