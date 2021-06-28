// @flow

import React, { type Node } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Avatar } from '../../base/avatar';
import {
    Icon,
    IconCameraEmpty,
    IconCameraEmptyDisabled,
    IconMicrophoneEmpty,
    IconMicrophoneEmptySlash
} from '../../base/icons';
import { getParticipantDisplayNameWithId } from '../../base/participants';
import { ACTION_TRIGGER, MEDIA_STATE, type ActionTrigger, type MediaState } from '../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import {
    ColoredIcon,
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
    [ACTION_TRIGGER.HOVER]: ParticipantActionsHover,
    [ACTION_TRIGGER.PERMANENT]: ParticipantActionsPermanent
};

/**
 * Icon mapping for possible participant audio states.
 */
const AudioStateIcons: {[MediaState]: React$Element<any> | null} = {
    [MEDIA_STATE.FORCE_MUTED]: (
        <ColoredIcon color = '#E04757'>
            <Icon
                size = { 16 }
                src = { IconMicrophoneEmptySlash } />
        </ColoredIcon>
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            size = { 16 }
            src = { IconMicrophoneEmptySlash } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <ColoredIcon color = '#1EC26A'>
            <Icon
                size = { 16 }
                src = { IconMicrophoneEmpty } />
        </ColoredIcon>
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Icon mapping for possible participant video states.
 */
const VideoStateIcons = {
    [MEDIA_STATE.FORCE_MUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmpty } />
    ),
    [MEDIA_STATE.NONE]: null
};

type Props = {

    /**
     * Type of trigger for the participant actions
     */
    actionsTrigger: ActionTrigger,

    /**
     * Media state for audio
     */
    audioMediaState: MediaState,

    /**
     * React children
     */
    children: Node,

    /**
     * Is this item highlighted/raised
     */
    isHighlighted?: boolean,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    name?: string,

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
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    videoMuteState = MEDIA_STATE.NONE,
    name,
    participant: p
}: Props) => {
    const ParticipantActions = Actions[actionsTrigger];
    const { t } = useTranslation();
    const displayName = name || useSelector(getParticipantDisplayNameWithId(p.id));

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
                        { displayName }
                    </ParticipantName>
                    { p.local ? <span>&nbsp;({t('chat.you')})</span> : null }
                </ParticipantNameContainer>
                { !p.local && <ParticipantActions children = { children } /> }
                <ParticipantStates>
                    {p.raisedHand && <RaisedHandIndicator />}
                    {VideoStateIcons[videoMuteState]}
                    {AudioStateIcons[audioMediaState]}
                </ParticipantStates>
            </ParticipantContent>
        </ParticipantContainer>
    );
};
