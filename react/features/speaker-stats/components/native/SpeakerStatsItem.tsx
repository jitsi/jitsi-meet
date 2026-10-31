import React from 'react';
import { useTranslation } from 'react-i18next';
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

const SpeakerStatsItem = (props: IProps) => {
    const { t } = useTranslation();
    const { displayName, dominantSpeakerTime, hasLeft, isDominantSpeaker, participantId } = props;
    const speakerLabel = t('speakerStats.speakerStats');
    const speakerTimeLabel = t('speakerStats.speakerTime');
    const nameLabel = `${speakerLabel}: ${displayName}`;

    return (
        <View
            key = { participantId }
            style = { style.speakerStatsItemContainer as ViewStyle }>
            <View style = { style.speakerStatsAvatar }>
                {
                    hasLeft ? (
                        <StatelessAvatar
                            color = { BaseTheme.palette.ui05 }
                            initials = { getInitials(displayName) }
                            size = { BaseTheme.spacing[5] } />
                    ) : (
                        <Avatar
                            className = 'userAvatar'
                            participantId = { participantId }
                            size = { BaseTheme.spacing[5] } />
                    )
                }
            </View>
            <View style = { style.speakerStatsNameTime as ViewStyle } >
                <Text
                    accessibilityLabel = { nameLabel }
                    style = { [ style.speakerStatsText, hasLeft && style.speakerStatsLeft ] }>
                    {displayName}
                </Text>
                <TimeElapsed
                    accessibilityLabel = { speakerTimeLabel }
                    style = { [
                        style.speakerStatsText,
                        style.speakerStatsTime,
                        isDominantSpeaker && style.speakerStatsDominant,
                        hasLeft && style.speakerStatsLeft
                    ] }
                    time = { dominantSpeakerTime } />
            </View>
        </View>
    );
};

export default SpeakerStatsItem;
