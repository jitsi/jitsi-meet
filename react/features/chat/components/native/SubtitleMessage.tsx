import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getParticipantDisplayName } from '../../../base/participants/functions';
import { ISubtitle } from '../../../subtitles/types';

import { closedCaptionsStyles } from './styles';


interface IProps extends ISubtitle {
    showDisplayName: boolean;
}

export default function SubtitleMessage({ participantId, text, timestamp, interim, showDisplayName }: IProps) {
    const participantName = useSelector((state: IReduxState) =>
        getParticipantDisplayName(state, participantId));

    const containerStyle: ViewStyle[] = [
        closedCaptionsStyles.subtitleMessageContainer as ViewStyle
    ];

    if (interim) {
        containerStyle.push(closedCaptionsStyles.subtitleMessageInterim as ViewStyle);
    }

    return (
        <View style = { containerStyle }>
            <View style = { closedCaptionsStyles.subtitleMessageContent as ViewStyle }>
                {
                    showDisplayName && (
                        <Text style = { closedCaptionsStyles.subtitleMessageHeader }>
                            { participantName }
                        </Text>
                    )
                }
                <Text style = { closedCaptionsStyles.subtitleMessageText }>{ text }</Text>
                <Text style = { closedCaptionsStyles.subtitleMessageTimestamp }>
                    { new Date(timestamp).toLocaleTimeString() }
                </Text>
            </View>
        </View>
    );
}
