import React from 'react';
import { useSelector } from 'react-redux';
import { Text, View } from 'react-native';

import { getConferenceName } from '../../../../base/conference/functions';
import { ConnectionIndicator } from '../../../../connection-indicator';
import { getFeatureFlag, MEETING_NAME_ENABLED } from '../../../../base/flags';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux';;
import { RecordingLabel } from '../../../../recording';
import { VideoQualityLabel } from '../../../../video-quality';

import { getLocalParticipant } from '../../../../base/participants';
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
    const localParticipant =  useSelector(getLocalParticipant);
    const localParticipantId = localParticipant?.id;

    return (<>
        <View
            pointerEvents = 'box-none'
            style = { styles.titleBarWrapper }>
            <View
                pointerEvents = 'box-none'
                style = { styles.roomNameWrapper }>
                <View style = { styles.qualityLabelContainer }>
                    <VideoQualityLabel />
                </View>
                <ConnectionIndicator
                    participantId = { localParticipantId }
                    iconStyle = { styles.connectionIndicatorIcon } />
                <View style = { styles.headerLabels }>
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                </View>

                {
                    props._meetingNameEnabled
                    && <View style = { styles.roomNameView }>
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
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object) {
    const { hideConferenceSubject } = state['features/base/config'];

    return {
        _meetingName: getConferenceName(state),
        _meetingNameEnabled:
            getFeatureFlag(state, MEETING_NAME_ENABLED, true) && !hideConferenceSubject
    };
}

export default connect(_mapStateToProps)(TitleBar);
