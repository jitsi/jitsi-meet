/* @flow */

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { Avatar } from '../../../base/avatar';
import { FACIAL_EXPRESSIONS } from '../../../facial-recognition/constants.js';

import TimeElapsed from './TimeElapsed';

const useStyles = makeStyles(theme => {
    return {
        item: {
            height: 48
        },
        avatar: {
            height: 32
        },
        expressions: {
            paddingLeft: 29
        },
        placeholderColor: {
            color: theme.palette.text03
        },
        time: {
            padding: '2px 4px',
            borderRadius: '4px'
        },
        dominant: {
            backgroundColor: theme.palette.success02
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
    const hasLeftClass = props.hasLeft ? classes.placeholderColor : '';
    const rowDisplayClass = `row ${hasLeftClass} ${classes.item}`;
    const expressionClass = 'expression';
    const nameTimeClass = `name-time${
        props.showFacialExpressions ? ' name-time_expressions-on' : ''
    }`;
    const timeClass = `${classes.time} ${props.isDominantSpeaker ? classes.dominant : ''}`;


    const FacialExpressions = () => (
        props.reduceExpressions
            ? FACIAL_EXPRESSIONS
                .filter(expression => ![ 'angry', 'fearful', 'disgusted' ].includes(expression))
            : FACIAL_EXPRESSIONS).map(
            expression => (
                <div
                    aria-label = { props.t(`speakerStats.${expression}`) }
                    className = {
                        `${expressionClass} ${
                            props.facialExpressions[expression] === 0 ? classes.placeholderColor : ''
                        }`
                    }
                    key = { expression }>
                    { props.facialExpressions[expression] }
                </div>
            )
    );

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
                    aria-label = { props.t('speakerStats.speakerTime') }
                    className = { timeClass }>
                    <TimeElapsed
                        time = { props.dominantSpeakerTime } />
                </div>
            </div>
            { props.showFacialExpressions
            && (
                <div className = { `expressions ${classes.expressions}` }>
                    <FacialExpressions />
                </div>
            )
            }
        </div>
    );
};

export default SpeakerStatsItem;
