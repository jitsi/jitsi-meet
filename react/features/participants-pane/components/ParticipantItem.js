// @flow

import React, { type Node } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '../../base/avatar';
import {
    Icon,
    IconCameraEmpty,
    IconCameraEmptyDisabled,
    IconMicrophoneEmpty,
    IconMicrophoneEmptySlash
} from '../../base/icons';
import { ActionTrigger, MediaState } from '../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import {
    ParticipantActionsHover,
    ParticipantActionsPermanent,
    ParticipantContainer,
    ParticipantContent,
    ParticipantName,
    ParticipantNameContainer,
    ParticipantStates
} from './styled';

/**
 * Participant actions component mapping depending on trigger type.
 */
const Actions = {
    [ActionTrigger.Hover]: ParticipantActionsHover,
    [ActionTrigger.Permanent]: ParticipantActionsPermanent
};

/**
 * Icon mapping for possible participant audio states.
 */
const AudioStateIcons = {
    [MediaState.ForceMuted]: (
        <Icon
            size = { 16 }
            src = { IconMicrophoneEmptySlash } />
    ),
    [MediaState.Muted]: (
        <Icon
            size = { 16 }
            src = { IconMicrophoneEmptySlash } />
    ),
    [MediaState.Unmuted]: (
        <Icon
            size = { 16 }
            src = { IconMicrophoneEmpty } />
    ),
    [MediaState.None]: null
};

/**
 * Icon mapping for possible participant video states.
 */
const VideoStateIcons = {
    [MediaState.ForceMuted]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MediaState.Muted]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MediaState.Unmuted]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmpty } />
    ),
    [MediaState.None]: null
};

type Props = {

    /**
     * Type of trigger for the participant actions
     */
    actionsTrigger: ActionTrigger,

    /**
     * Media state for audio
     */
    audioMuteState: MediaState,

    /**
     * React children
     */
    children: Node,

    /**
     * Is this item highlighted/raised
     */
    isHighlighted?: boolean,

    /**
     * Callback for when the mouse leaves this component
     */
    onLeave?: Function,

    /**
     * Participant reference
     */
    participant: Object,

    /**
     * Media state for video
     */
    videoMuteState: MediaState
}

export const ParticipantItem = ({
    children,
    isHighlighted,
    onLeave,
    actionsTrigger = ActionTrigger.Hover,
    audioMuteState = MediaState.None,
    videoMuteState = MediaState.None,
    participant: p
}: Props) => {
    const ParticipantActions = Actions[actionsTrigger];
    const { t } = useTranslation();

    return (
        <ParticipantContainer
            isHighlighted = { isHighlighted }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            <Avatar
                className = 'participant-avatar'
                participantId = { p.id }
                size = { 32 } />
            <ParticipantContent>
                <ParticipantNameContainer>
                    <ParticipantName>
                        { p.name }
                    </ParticipantName>
                    { p.local ? <span>&nbsp;({t('chat.you')})</span> : null }
                </ParticipantNameContainer>
                { !p.local && <ParticipantActions children = { children } /> }
                <ParticipantStates>
                    {p.raisedHand && <RaisedHandIndicator />}
                    {VideoStateIcons[videoMuteState]}
                    {AudioStateIcons[audioMuteState]}
                </ParticipantStates>
            </ParticipantContent>
        </ParticipantContainer>
    );
};
