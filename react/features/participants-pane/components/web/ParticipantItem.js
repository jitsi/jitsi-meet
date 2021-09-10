// @flow

import React, { type Node, useCallback } from 'react';

import { Avatar } from '../../../base/avatar';
import {
    ACTION_TRIGGER,
    AudioStateIcons,
    MEDIA_STATE,
    type ActionTrigger,
    type MediaState,
    VideoStateIcons
} from '../../constants';

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
    [ACTION_TRIGGER.HOVER]: ParticipantActionsHover,
    [ACTION_TRIGGER.PERMANENT]: ParticipantActionsPermanent
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
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string,

    /**
     * Is this item highlighted/raised
     */
    isHighlighted?: boolean,

    /**
     * True if the participant is local.
     */
    local: Boolean,

    /**
     * Opens a drawer with participant actions.
     */
    openDrawerForParticipant: Function,

    /**
     * Callback for when the mouse leaves this component
     */
    onLeave?: Function,

    /**
     * If an overflow drawer can be opened.
     */
    overflowDrawer?: boolean,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * True if the participant have raised hand.
     */
    raisedHand: boolean,

    /**
     * Media state for video
     */
    videoMediaState: MediaState,

    /**
     * The translated "you" text.
     */
    youText: string
}

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactNode}
 */
export default function ParticipantItem({
    children,
    isHighlighted,
    onLeave,
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE,
    displayName,
    participantID,
    local,
    openDrawerForParticipant,
    overflowDrawer,
    raisedHand,
    youText
}: Props) {
    const ParticipantActions = Actions[actionsTrigger];
    const onClick = useCallback(
        () => openDrawerForParticipant({
            participantID,
            displayName
        }));

    return (
        <ParticipantContainer
            id = { `participant-item-${participantID}` }
            isHighlighted = { isHighlighted }
            local = { local }
            onClick = { !local && overflowDrawer ? onClick : undefined }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            <Avatar
                className = 'participant-avatar'
                participantId = { participantID }
                size = { 32 } />
            <ParticipantContent>
                <ParticipantNameContainer>
                    <ParticipantName>
                        { displayName }
                    </ParticipantName>
                    { local ? <span>&nbsp;({ youText })</span> : null }
                </ParticipantNameContainer>
                { !local && <ParticipantActions children = { children } /> }
                <ParticipantStates>
                    { raisedHand && <RaisedHandIndicator /> }
                    { VideoStateIcons[videoMediaState] }
                    { AudioStateIcons[audioMediaState] }
                </ParticipantStates>
            </ParticipantContent>
        </ParticipantContainer>
    );
}
