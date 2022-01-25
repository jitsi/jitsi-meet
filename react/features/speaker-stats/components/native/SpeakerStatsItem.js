// @flow

import React from 'react';
import { View, Text } from 'react-native';

import { Avatar, StatelessAvatar } from '../../../base/avatar';
import { getInitials } from '../../../base/avatar/functions';

import TimeElapsed from './TimeElapsed';
import style from './styles';

type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

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
    isDominantSpeaker: boolean
};

const SpeakerStatsItem = (props: Props) =>
    (
        <View
            key = { props.participantId }
            style = { style.speakerStatsItemContainer }>
            <View style = { style.speakerStatsAvatar }>
                {
                    props.hasLeft ? (
                        <StatelessAvatar
                            className = 'userAvatar'
                            color = { '#525252' }
                            id = 'avatar'
                            initials = { getInitials(props.displayName) }
                            size = { 32 } />
                    ) : (
                        <Avatar
                            className = 'userAvatar'
                            participantId = { props.participantId }
                            size = { 32 } />
                    )
                }
            </View>
            <View style = { style.speakerStatsNameTime } >
                <Text style = { style.speakerStatsText }>
                    {props.displayName}
                </Text>
                <TimeElapsed
                    style = { [
                        style.speakerStatsText,
                        style.speakerStatsTime,
                        props.isDominantSpeaker && style.speakerStatsDominant
                    ] }
                    time = { props.dominantSpeakerTime } />
            </View>
        </View>
    )
;

export default SpeakerStatsItem;
