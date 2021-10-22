// @flow

import React from 'react';
import { View, Text } from 'react-native';

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
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean
};

const SpeakerStatsItem = (props: Props) => {
    /**
     * @inheritdoc
     * @returns {ReactElement}
     */
    const dotColor = props.isDominantSpeaker
        ? '#00FF00' : '#a0a0a0';

    return (
        <View style = { style.speakerStatsItemContainer }>
            <View style = { style.speakerStatsItemStatus }>
                <View style = { [ style.speakerStatsItemStatusDot, { backgroundColor: dotColor } ] } />
            </View>
            <View style = { [ style.speakerStatsItemStatus, style.speakerStatsItemName ] }>
                <Text>
                    { props.displayName }
                </Text>
            </View>
            <View style = { [ style.speakerStatsItemStatus, style.speakerStatsItemTime ] }>
                <TimeElapsed
                    time = { props.dominantSpeakerTime } />
            </View>
        </View>
    );
};

export default SpeakerStatsItem;
