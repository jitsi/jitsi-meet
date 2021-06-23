// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { QUICK_ACTION_BUTTON } from '../constants';
import { getQuickActionButtonType } from '../functions';

import AskToUnmuteButton from './AskToUnmuteButton';
import { QuickActionButton } from './styled';

type Props = {

    /**
     * If audio is muted for the current participant.
     */
    isAudioMuted: Boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Participant.
     */
    participant: Object,
}

/**
 * Component used to display mute/ask to unmute button.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element<'button'>}
 */
export default function({ isAudioMuted, muteAudio, participant }: Props) {
    const buttonType = useSelector(getQuickActionButtonType(participant, isAudioMuted));
    const { id } = participant;
    const { t } = useTranslation();

    switch (buttonType) {
    case QUICK_ACTION_BUTTON.MUTE: {
        return (
            <QuickActionButton
                onClick = { muteAudio(id) }
                primary = { true }>
                {t('dialog.muteParticipantButton')}
            </QuickActionButton>
        );
    }
    case QUICK_ACTION_BUTTON.ASK_TO_UNMUTE: {
        return <AskToUnmuteButton id = { id } />;
    }
    default: {
        return null;
    }
    }
}
