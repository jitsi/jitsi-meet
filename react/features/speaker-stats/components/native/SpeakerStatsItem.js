// @flow

import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { translate } from '../../../base/i18n';

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
    isDominantSpeaker: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @extends Component
 */
class SpeakerStatsItem extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <View>
                <View>
                    <Text>
                        { this.props.displayName }
                    </Text>
                </View>
                <View>
                    <TimeElapsed
                        time = { this.props.dominantSpeakerTime } />
                </View>
            </View>
        );
    }
}

export default translate(SpeakerStatsItem);
