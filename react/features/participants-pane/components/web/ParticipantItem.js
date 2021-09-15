// @flow

import React, { type Node, useCallback, useState, useEffect } from 'react';

import { Avatar } from '../../../base/avatar';
import TimeElapsed from '../../../speaker-stats/components/TimeElapsed';
import { translate } from '../../../base/i18n';
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
    ModeratorLabel,
    ParticipantActionsHover,
    ParticipantActionsPermanent,
    ParticipantContainer,
    ParticipantContent,
    ParticipantDetailsContainer,
    ParticipantName,
    ParticipantNameContainer,
    ParticipantStates,
    TimeElapsedSpacer
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
     * Whether or not the participant is a moderator.
     */
    isModerator: boolean,

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
     * Time when the participant have raised hand.
     */
    raisedAt: number,

    /**
     * True if the participant have raised hand first.
     */
    raisedFirst: boolean,

    /**
     * True if the participant have raised hand.
     */
    raisedHand: boolean,

    /**
     * Media state for video
     */
    videoMediaState: MediaState,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

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
function ParticipantItem({
    children,
    isHighlighted,
    isModerator,
    onLeave,
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE,
    displayName,
    participantID,
    local,
    openDrawerForParticipant,
    overflowDrawer,
    raisedAt,
    raisedFirst,
    raisedHand,
    t,
    youText
}: Props) {
    const [ waitingTime, setWaitingTime ] = useState(Date.now() - raisedAt);
    const [ showHandTime, setShowHandTime ] = useState(false);
    const ParticipantActions = Actions[actionsTrigger];
    const onClick = useCallback(
        () => openDrawerForParticipant({
            participantID,
            displayName
        }));

    useEffect(() => {
        const timeInterval = setInterval(() => {
            const tm = raisedAt ? Date.now() - raisedAt : 0;

            setWaitingTime(isNaN(tm) ? 0 : tm);
        }, 1000);

        return () => clearInterval(timeInterval);
    }, [ raisedAt ]);

    return (
        <ParticipantContainer
            id = { `participant-item-${participantID}` }
            isHighlighted = { isHighlighted }
            local = { local }
            onClick = { !local && overflowDrawer ? onClick : undefined }
            onMouseEnter = { () => setShowHandTime(true) }
            onMouseLeave = { e => { onLeave(e); setShowHandTime(false); } }
            trigger = { actionsTrigger }>
            <Avatar
                className = 'participant-avatar'
                participantId = { participantID }
                size = { 32 } />
            <ParticipantContent>
                <ParticipantDetailsContainer>
                    <ParticipantNameContainer>
                        <ParticipantName>
                            { displayName }
                        </ParticipantName>
                        { local ? <span>&nbsp;({ youText })</span> : null }
                    </ParticipantNameContainer>
                    {isModerator && <ModeratorLabel>
                        {t('videothumbnail.moderator')}
                    </ModeratorLabel>}
                </ParticipantDetailsContainer>
                { !local && <ParticipantActions children = { children } /> }
                { (showHandTime && raisedAt > 0) && <TimeElapsedSpacer isLocal = { local }><TimeElapsed time = { waitingTime } /></TimeElapsedSpacer> }
                <ParticipantStates>
                    { raisedHand && <RaisedHandIndicator isFirst = { raisedFirst } /> }
                    { VideoStateIcons[videoMediaState] }
                    { AudioStateIcons[audioMediaState] }
                </ParticipantStates>
            </ParticipantContent>
        </ParticipantContainer>
    );
}

export default translate(ParticipantItem);
