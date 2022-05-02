/* @flow */

import React from 'react';

import { Avatar, StatelessAvatar } from '../../../base/avatar';
import { getInitials } from '../../../base/avatar/functions';
import BaseTheme from '../../../base/ui/components/BaseTheme';
import { FACE_EXPRESSIONS } from '../../../face-landmarks/constants.js';

import TimeElapsed from './TimeElapsed';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

    /**
     * The object that has as keys the face expressions of the
     * participant and as values a number that represents the count .
     */
    faceExpressions: Object,

    /**
     * True if the face expressions detection is not disabled.
     */
    showFaceExpressions: boolean,

    /**
     * The total milliseconds the participant has been dominant speaker.
     */
    dominantSpeakerTime: number,

    /**
     * The id of the user.
     */
    participantId: string,

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * True if the participant is not shown in speaker stats.
     */
    hidden: boolean,

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean,

    /**
     * Styles for the item.
     */
    styles: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

const SpeakerStatsItem = (props: Props) => {
    const hasLeftClass = props.hasLeft ? props.styles.hasLeft : '';
    const rowDisplayClass = `row ${hasLeftClass} ${props.styles.item}`;
    const expressionClass = 'expression';
    const nameTimeClass = `name-time${
        props.showFaceExpressions ? ' name-time_expressions-on' : ''
    }`;
    const timeClass = `${props.styles.time} ${props.isDominantSpeaker ? props.styles.dominant : ''}`;


    const FaceExpressions = () => FACE_EXPRESSIONS.map(
            expression => (
                <div
                    aria-label = { props.t(`speakerStats.${expression}`) }
                    className = {
                        `${expressionClass} ${
                            props.faceExpressions[expression] === 0 ? props.styles.hasLeft : ''
                        }`
                    }
                    key = { expression }>
                    { props.faceExpressions[expression] }
                </div>
            )
    );

    return (
        <div
            className = { rowDisplayClass }
            key = { props.participantId } >
            <div className = { `avatar ${props.styles.avatar}` }>
                {
                    props.hasLeft ? (
                        <StatelessAvatar
                            className = 'userAvatar'
                            color = { BaseTheme.palette.ui04 }
                            id = 'avatar'
                            initials = { getInitials(props.displayName) } />
                    ) : (
                        <Avatar
                            className = 'userAvatar'
                            participantId = { props.participantId } />
                    )
                }
            </div>
            <div className = { nameTimeClass }>
                <div
                    aria-label = { props.t('speakerStats.speakerStats') }
                    className = { props.styles.displayName }>
                    { props.displayName }
                </div>
                <div
                    aria-label = { props.t('speakerStats.speakerTime') }
                    className = { timeClass }>
                    <TimeElapsed
                        time = { props.dominantSpeakerTime } />
                </div>
            </div>
            { props.showFaceExpressions
            && (
                <div className = { `expressions ${props.styles.expressions}` }>
                    <FaceExpressions />
                </div>
            )}
        </div>
    );
};

export default SpeakerStatsItem;
