import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { connect, useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { getConferenceName } from '../../../../base/conference/functions';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { getLocalParticipant } from '../../../../base/participants/functions';
import ConnectionIndicator from '../../../../connection-indicator/components/native/ConnectionIndicator';
import { isRoomNameEnabled } from '../../../../prejoin/functions';
import RecordingLabel from '../../../../recording/components/native/RecordingLabel';
import VideoQualityLabel from '../../../../video-quality/components/VideoQualityLabel.native';

import styles from './styles';


interface IProps {

    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string;

    /**
     * Whether displaying the current meeting name is enabled or not.
     */
    _meetingNameEnabled: boolean;

}

/**
 * Implements a navigation bar component that is rendered on top of the
 * carmode screen.
 *
 * @param {IProps} props - The React props passed to this component.
 * @returns {JSX.Element}
 */
const TitleBar = (props: IProps): JSX.Element => {
    const localParticipant = useSelector(getLocalParticipant);
    const localParticipantId = localParticipant?.id;

    return (
        <View
            style = { styles.titleBarWrapper as StyleProp<ViewStyle> }>
            <View
                pointerEvents = 'box-none'
                style = { styles.roomNameWrapper as StyleProp<ViewStyle> }>
                <View style = { styles.qualityLabelContainer as StyleProp<ViewStyle> }>
                    <VideoQualityLabel />
                </View>
                <ConnectionIndicator
                    iconStyle = { styles.connectionIndicatorIcon }
                    participantId = { localParticipantId } />
                <View style = { styles.headerLabels as StyleProp<ViewStyle> }>
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                </View>
                {
                    props._meetingNameEnabled
                    && <View style = { styles.roomNameView as StyleProp<ViewStyle> }>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.roomName }>
                            { props._meetingName }
                        </Text>
                    </View>
                }
            </View>
        </View>
    );
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _meetingName: getConferenceName(state),
        _meetingNameEnabled: isRoomNameEnabled(state)
    };
}

export default connect(_mapStateToProps)(TitleBar);
