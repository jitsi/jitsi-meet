// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../../av-moderation/actions';
import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { IconMicrophoneEmpty } from '../../../base/icons';

type Props = {

    /**
     * Whether or not the participant is audio force muted.
     */
    isAudioForceMuted: boolean,

    /**
     * Whether or not the participant is video force muted.
     */
    isVideoForceMuted: boolean,

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string
}

const AskToUnmuteButton = ({ isAudioForceMuted, isVideoForceMuted, participantID }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        dispatch(approveParticipant(participantID));
    }, [ participantID ]);

    const text = isAudioForceMuted || !isVideoForceMuted
        ? t('participantsPane.actions.askUnmute')
        : t('participantsPane.actions.allowVideo');

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { IconMicrophoneEmpty }
            onClick = { _onClick }
            text = { text } />
    );
};

export default AskToUnmuteButton;
