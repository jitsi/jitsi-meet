/* eslint-disable lines-around-comment */
import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

// @ts-ignore
import { getConferenceName } from '../../../../base/conference/functions';
// @ts-ignore
import { getFeatureFlag, MEETING_NAME_ENABLED } from '../../../../base/flags';
// @ts-ignore
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { getLocalParticipant } from '../../../../base/participants/functions';
import { connect } from '../../../../base/redux/functions';
// @ts-ignore
import ConnectionIndicator from '../../../../connection-indicator/components/native/ConnectionIndicator';
// @ts-ignore
import RecordingLabel from '../../../../recording/components/native/RecordingLabel';
// @ts-ignore
import { VideoQualityLabel } from '../../../../video-quality';

// @ts-ignore
import styles from './styles';


type Props = {

    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string,

    /**
     * Whether displaying the current meeting name is enabled or not.
     */
    _meetingNameEnabled: boolean,

};

/**
 * Implements a navigation bar component that is rendered on top of the
 * carmode screen.
 *
 * @param {Props} props - The React props passed to this component.
 * @returns {JSX.Element}
 */
const TitleBar = (props: Props) : JSX.Element => {
    const localParticipant: any = useSelector(getLocalParticipant);
    const localParticipantId = localParticipant?.id;

    return (<>
        <View
            pointerEvents = 'box-none'
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
                            {props._meetingName}
                        </Text>
                    </View>
                }
            </View>
        </View>
    </>);
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: any) {
    const { hideConferenceSubject } = state['features/base/config'];

    return {
        _meetingName: getConferenceName(state),
        _meetingNameEnabled:
            getFeatureFlag(state, MEETING_NAME_ENABLED, true) && !hideConferenceSubject
    };
}

export default connect(_mapStateToProps)(TitleBar);
