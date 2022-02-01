/* @flow */

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { Avatar } from '../../../base/avatar';

import TimeElapsed from './TimeElapsed';

const useStyles = makeStyles(() => {
    return {
        item: {
            height: 48
        },
        avatar: {
            height: 32
        },
        expressions: {
            paddingLeft: 29
        }

    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

    /**
     * The object that has as keys the facial expressions of the
     * participant and as values a number that represents the count .
     */
    facialExpressions: Object,

    /**
     * True if the client width is les than 750.
     */
    reduceExpressions: boolean,

    /**
     * True if the facial recognition is not disabled.
     */
    showFacialExpressions: boolean,

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
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

const SpeakerStatsItem = (props: Props) => {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */

    const classes = useStyles();
    const hasLeftClass = props.hasLeft ? 'status-user-left' : '';
    const rowDisplayClass = `row ${hasLeftClass} ${classes.item}`;
    const expressionClass = 'expression';
    const nameTimeClass = `name-time${
        props.showFacialExpressions ? ' name-time_expressions-on' : ''
    }`;

    return (
        <div
            className = { rowDisplayClass }
            key = { props.participantId } >
            <div className = { `avatar ${classes.avatar}` }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { props.participantId } />
            </div>
            <div className = { nameTimeClass }>
                <div
                    aria-label = { props.t('speakerStats.speakerStats') }
                    className = 'text-large'>
                    { props.displayName }
                </div>
                <div
                    aria-label = { props.t('speakerStats.speakerTime') }>
                    <TimeElapsed
                        time = { props.dominantSpeakerTime } />
                </div>
            </div>
            { props.showFacialExpressions
            && (
                <div className = { `expressions ${classes.expressions}` }>
                    <div
                        aria-label = { 'Happy' }
                        className = { expressionClass }>
                        { props.facialExpressions.happy }
                    </div>
                    <div
                        aria-label = { 'Neutral' }
                        className = { expressionClass }>
                        { props.facialExpressions.neutral }
                    </div>
                    <div
                        aria-label = { 'Sad' }
                        className = { expressionClass }>
                        { props.facialExpressions.sad }
                    </div>
                    <div
                        aria-label = { 'Surprised' }
                        className = { expressionClass }>
                        { props.facialExpressions.surprised }
                    </div>
                    { !props.reduceExpressions && (
                        <>
                            <div
                                aria-label = { 'Angry' }
                                className = { expressionClass }>
                                { props.facialExpressions.angry }
                            </div>
                            <div
                                aria-label = { 'Fearful' }
                                className = { expressionClass }>
                                { props.facialExpressions.fearful }
                            </div>
                            {/* <div
                                aria-label = { 'Disgusted' }>
                                { props.facialExpressions.disgusted }
                            </div> */}
                        </>
                    )}
                </div>
            )
            }
        </div>
    );
};

export default SpeakerStatsItem;
