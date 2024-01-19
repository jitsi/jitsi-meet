// eslint-disable-next-line lines-around-comment
import React from 'react';

import Avatar from '../../../base/avatar/components/Avatar';
import StatelessAvatar from '../../../base/avatar/components/web/StatelessAvatar';
import { getInitials } from '../../../base/avatar/functions';
import { IconUser } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
import { FaceLandmarks } from '../../../face-landmarks/types';

import TimeElapsed from './TimeElapsed';
import Timeline from './Timeline';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
interface IProps {

    /**
     * The name of the participant.
     */
    displayName: string;

    /**
     * The total milliseconds the participant has been dominant speaker.
     */
    dominantSpeakerTime: number;

    /**
     * The object that has as keys the face expressions of the
     * participant and as values a number that represents the count .
     */
    faceLandmarks?: FaceLandmarks[];

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean;

    /**
     * True if the participant is not shown in speaker stats.
     */
    hidden: boolean;

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean;

    /**
     * The id of the user.
     */
    participantId: string;

    /**
     * True if the face expressions detection is not disabled.
     */
    showFaceExpressions: boolean;

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
}

const SpeakerStatsItem = (props: IProps) => {
    const rowDisplayClass = `row item ${props.hasLeft ? 'has-left' : ''}`;
    const nameTimeClass = `name-time${
        props.showFaceExpressions ? ' expressions-on' : ''
    }`;
    const timeClass = `time ${props.isDominantSpeaker ? 'dominant' : ''}`;

    return (
        <div key = { props.participantId }>
            <div className = { rowDisplayClass } >
                <div className = 'avatar' >
                    {
                        props.hasLeft ? (
                            <StatelessAvatar
                                className = 'userAvatar'
                                color = { BaseTheme.palette.ui04 }
                                iconUser = { IconUser }
                                initials = { getInitials(props.displayName) }
                                size = { 32 } />
                        ) : (
                            <Avatar
                                className = 'userAvatar'
                                participantId = { props.participantId }
                                size = { 32 } />
                        )
                    }
                </div>
                <div className = { nameTimeClass }>
                    <div
                        aria-label = { props.t('speakerStats.speakerStats') }
                        className = 'display-name'>
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
            && <Timeline faceLandmarks = { props.faceLandmarks } />
                }

            </div>
            <div className = 'separator' />
        </div>
    );
};

export default SpeakerStatsItem;
