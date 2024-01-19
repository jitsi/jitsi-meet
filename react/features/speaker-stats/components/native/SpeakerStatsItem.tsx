import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import Avatar from '../../../base/avatar/components/Avatar';
import StatelessAvatar from '../../../base/avatar/components/native/StatelessAvatar';
import { getInitials } from '../../../base/avatar/functions';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import TimeElapsed from './TimeElapsed';
import style from './styles';

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
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean;

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean;

    /**
     * The id of the user.
     */
    participantId: string;
}

const SpeakerStatsItem = (props: IProps) =>
    (
        <View
            key = { props.participantId }
            style = { style.speakerStatsItemContainer as ViewStyle }>
            <View style = { style.speakerStatsAvatar }>
                {
                    props.hasLeft ? (
                        <StatelessAvatar
                            color = { BaseTheme.palette.ui05 }
                            initials = { getInitials(props.displayName) }
                            size = { BaseTheme.spacing[5] } />
                    ) : (
                        <Avatar
                            className = 'userAvatar'
                            participantId = { props.participantId }
                            size = { BaseTheme.spacing[5] } />
                    )
                }
            </View>
            <View style = { style.speakerStatsNameTime as ViewStyle } >
                <Text style = { [ style.speakerStatsText, props.hasLeft && style.speakerStatsLeft ] }>
                    {props.displayName}
                </Text>
                <TimeElapsed
                    style = { [
                        style.speakerStatsText,
                        style.speakerStatsTime,
                        props.isDominantSpeaker && style.speakerStatsDominant,
                        props.hasLeft && style.speakerStatsLeft
                    ] }
                    time = { props.dominantSpeakerTime } />
            </View>
        </View>
    );

export default SpeakerStatsItem;
